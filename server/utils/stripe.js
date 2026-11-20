
require("dotenv").config();

const Stripe = require("stripe");

const secretKey = process.env.STRIPE_SECRET_KEY;

let stripe = null;

if (secretKey && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"))) {
  stripe = new Stripe(secretKey);
}

module.exports = stripe;
