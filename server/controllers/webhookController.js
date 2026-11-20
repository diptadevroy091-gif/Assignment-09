
const stripe = require("../utils/stripe");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// ======================================
// HANDLE STRIPE WEBHOOK
// ======================================
const handleStripeWebhook = async (req, res) => {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Stripe webhook is not configured!",
      });
    }

    const signature = req.headers["stripe-signature"];

    let event;

    // Verify Stripe webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Webhook Signature Error:", error.message);

      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );
    }

    // ======================================
    // PAYMENT SUCCESS
    // ======================================
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;

      // Confirm payment is actually completed
      if (session.payment_status !== "paid") {
        return res.status(200).json({
          received: true,
          message: "Payment is not completed yet.",
        });
      }

      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is missing from Stripe session!",
        });
      }

      // Find booking
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found!",
        });
      }

      // Verify Stripe session
      if (booking.stripeSessionId !== session.id) {
        return res.status(400).json({
          success: false,
          message: "Stripe session does not match booking!",
        });
      }

      // Verify payment amount
      if (
        session.amount_total !==
        Math.round(booking.totalAmount * 100)
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment amount does not match booking!",
        });
      }

      // Verify customer
      if (
        session.metadata?.customerId &&
        session.metadata.customerId !== booking.customerInfo.userId
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment customer does not match booking!",
        });
      }

      // ======================================
      // UPDATE BOOKING
      // ======================================
      if (booking.paymentStatus !== "Paid") {
        booking.paymentStatus = "Paid";
        booking.bookingStatus = "Confirmed";

        await booking.save();
      }

      // ======================================
      // UPDATE OR CREATE PAYMENT RECORD
      // ======================================
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "";

      await Payment.findOneAndUpdate(
        {
          stripeSessionId: session.id,
        },
        {
          $set: {
            bookingId: booking._id,
            customerId: booking.customerInfo.userId,
            customerEmail: booking.customerInfo.email,
            amount: session.amount_total / 100,
            currency: session.currency || "usd",
            transactionId: paymentIntentId,
            paymentStatus: "Paid",
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      console.log(
        `Payment successful for booking: ${booking._id}`
      );
    }

    // ======================================
    // PAYMENT FAILED / EXPIRED
    // ======================================
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      await Payment.findOneAndUpdate(
        {
          stripeSessionId: session.id,
          paymentStatus: "Pending",
        },
        {
          $set: {
            paymentStatus: "Failed",
          },
        }
      );

      await Booking.findOneAndUpdate(
        {
          stripeSessionId: session.id,
          paymentStatus: "Pending",
        },
        {
          $set: {
            paymentStatus: "Failed",
            bookingStatus: "Cancelled",
          },
        }
      );

      console.log(
        `Checkout session expired: ${session.id}`
      );
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed!",
    });
  }
};

// ======================================
// EXPORT
// ======================================
module.exports = {
  handleStripeWebhook,
};
