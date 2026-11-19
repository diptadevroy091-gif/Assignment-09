
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

    // Save Stripe session ID
    booking.stripeSessionId = session.id;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Checkout session created successfully!",
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
};
