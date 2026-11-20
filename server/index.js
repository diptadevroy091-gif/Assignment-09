
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { passport } = require("./config/passport");

const equipmentRoutes = require("./routes/equipmentRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");

const app = express();

// Allowed Frontend Origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://assignment-09-wheat.vercel.app",
  "https://assignment-09-git-main-diptadevroy091-gif.vercel.app",
  "https://assignment-09-dl7l0ypmb-diptadevroy091-gif.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Stripe Webhook - Raw Body
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" })
);

// Passport Middleware
app.use(passport.initialize());

// JSON Middleware
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Equipora API is running successfully!",
  });
});

// API Routes
app.use("/api/equipment", equipmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks/stripe", webhookRoutes);
app.use("/api/favorites", favoriteRoutes);

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Equipora server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
