
const Stripe = require("stripe");

const secretKey = process.env.STRIPE_SECRET_KEY;

const stripe =
  secretKey &&
  (secretKey.startsWith("sk_test_") ||
    secretKey.startsWith("sk_live_"))
    ? new Stripe(secretKey)
    : null;

module.exports = stripe;
