
const express = require("express");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  deletePendingBooking,
} = require("../controllers/bookingController");

const verifyToken = require("../middleware/verifyToken");
const {
  verifyAdmin,
  verifyCustomer,
} = require("../middleware/verifyRole");

const router = express.Router();

// Customer routes
router.post("/", verifyToken, verifyCustomer, createBooking);
router.get("/my-bookings", verifyToken, verifyCustomer, getMyBookings);

// Admin routes
router.get("/admin/all", verifyToken, verifyAdmin, getAllBookings);
router.delete(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  deletePendingBooking
);

module.exports = router;
