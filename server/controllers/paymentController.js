
const stripe = require("../utils/stripe");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe API key is not configured!",
      });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required!",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      "customerInfo.userId": req.user.id,
      paymentStatus: "Pending",
    }).populate("equipmentId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Pending booking not found!",
      });
    }

    if (booking.stripeSessionId) {
      return res.status(400).json({
        success: false,
        message: "Checkout session already created!",
      });
    }

    if (!booking.equipmentId) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found!",
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: booking.customerInfo.email,

      client_reference_id: booking._id.toString(),

      metadata: {
        bookingId: booking._id.toString(),
        customerId: booking.customerInfo.userId,
      },

      line_items: [
        {
          price_data: {
            currency: "bdt",

            product_data: {
              name: booking.equipmentId.equipmentName,
            },

            // BDT amount in paisa
            unit_amount: Math.round(
              booking.totalAmount * 100
            ),
          },

          quantity: 1,
        },
      ],

      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    // Save pending payment
    await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerInfo.userId,
      customerEmail: booking.customerInfo.email,
      amount: booking.totalAmount,
      currency: "bdt",
      stripeSessionId: session.id,
      paymentStatus: "Pending",
    });

    // Save Stripe session ID in booking
    booking.stripeSessionId = session.id;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Checkout session created successfully!",
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout Session Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify Stripe Payment Session
const verifyPaymentSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe is not configured!",
      });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Stripe session ID is required!",
      });
    }

    const session =
      await stripe.checkout.sessions.retrieve(session_id);

    const bookingId = session.metadata?.bookingId;
    const customerId = session.metadata?.customerId;

    if (!bookingId || customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to verify this payment!",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      "customerInfo.userId": req.user.id,
      stripeSessionId: session.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Related booking not found!",
      });
    }

    // Verify currency and payment amount
    if (
      session.currency !== "bdt" ||
      session.amount_total !==
        Math.round(booking.totalAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency verification failed!",
      });
    }

    // Payment successful
    if (session.payment_status === "paid") {
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Confirmed";

      await booking.save();

      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          $set: {
            bookingId: booking._id,
            customerId: booking.customerInfo.userId,
            customerEmail: booking.customerInfo.email,
            amount: session.amount_total / 100,
            currency: session.currency,
            transactionId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || "",
            paymentStatus: "Paid",
          },
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        success: true,
        paymentStatus: "Paid",
        message: "Payment verified successfully!",
        data: {
          bookingId: booking._id,
          amount: session.amount_total / 100,
          currency: session.currency,
        },
      });
    }

    return res.status(200).json({
      success: true,
      paymentStatus: "Pending",
      message: "Payment is not completed yet.",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  verifyPaymentSession,
};
