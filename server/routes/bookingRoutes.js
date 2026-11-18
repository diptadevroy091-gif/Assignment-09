
const express = require("express");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
} = require("../controllers/bookingController");

const verifyToken = require("../middleware/verifyToken");

const {
  verifyAdmin,
  verifyCustomer,
} = require("../middleware/verifyRole");

const router = express.Router();

// Create booking (Customer only)
router.post("/", verifyToken, verifyCustomer, createBooking);

// Get my bookings (Customer only)
router.get("/my-bookings", verifyToken, verifyCustomer, getMyBookings);

// Get all bookings (Admin only)
router.get("/admin/all", verifyToken, verifyAdmin, getAllBookings);

module.exports = router;
