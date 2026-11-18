
const express = require("express");

const {
  createCheckoutSession,
} = require("../controllers/paymentController");

const verifyToken = require("../middleware/verifyToken");
const { verifyCustomer } = require("../middleware/verifyRole");

const router = express.Router();

// Create Stripe Checkout Session
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

module.exports = router;
