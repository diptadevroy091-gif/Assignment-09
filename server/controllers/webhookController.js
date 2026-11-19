
const stripe = require("../utils/stripe");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Handle Stripe Webhook
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
      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );
    }

    // Handle successful payment
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;

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

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found!",
        });
      }

      // Verify session belongs to this booking
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

      // Update booking after successful payment
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Confirmed";

      await booking.save();

      // Save payment transaction
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          $setOnInsert: {
            bookingId: booking._id,
            customerId: booking.customerInfo.userId,
            customerEmail: booking.customerInfo.email,
            amount: session.amount_total / 100,
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            transactionId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || "",
            paymentStatus: "Paid",
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);

    res.status(500).json({
      success: false,
      message: "Webhook processing failed!",
    });
  }
};

module.exports = {
  handleStripeWebhook,
};
