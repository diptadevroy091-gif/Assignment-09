
const express = require("express");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getOwnerAnalytics,
  getOwnerBookings,
  deletePendingBooking,
} = require("../controllers/bookingController");

const verifyToken = require("../middleware/verifyToken");

const {
  verifyAdmin,
  verifyCustomer,
  verifyOwner,
} = require("../middleware/verifyRole");

const router = express.Router();

// Customer Routes
router.post("/", verifyToken, verifyCustomer, createBooking);

router.get(
  "/my-bookings",
  verifyToken,
  verifyCustomer,
  getMyBookings
);

// Owner Routes
router.get(
  "/owner/analytics",
  verifyToken,
  verifyOwner,
  getOwnerAnalytics
);

router.get(
  "/owner/my-bookings",
  verifyToken,
  verifyOwner,
  getOwnerBookings
);

// Admin Routes
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  getAllBookings
);

router.delete(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  deletePendingBooking
);

module.exports = router;
