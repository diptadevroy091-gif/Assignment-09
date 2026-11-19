
const stripe = require("../utils/stripe");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe API key is not configured yet!",
      });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required!",
      });
    }

    // Find customer's own pending booking
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

    // Prevent duplicate checkout sessions
    if (booking.stripeSessionId) {
      return res.status(400).json({
        success: false,
        message: "Checkout session already created for this booking!",
      });
    }

    // Validate equipment
    if (!booking.equipmentId) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found!",
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
            currency: "usd",
            product_data: {
              name: booking.equipmentId.equipmentName,
            },
            unit_amount: Math.round(booking.totalAmount * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    // Save Payment Record
    await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerInfo.userId,
      customerEmail: booking.customerInfo.email,
      amount: booking.totalAmount,
      currency: "usd",
      stripeSessionId: session.id,
      paymentStatus: "Pending",
    });

    // Save Stripe Session ID in Booking
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

module.exports = {
  createCheckoutSession,
};
