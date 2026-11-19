
const express = require("express");

const {
  getAllUsers,
  updateUserRole,
  updateUserBlockStatus,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");

const verifyToken = require("../middleware/verifyToken");
const { verifyAdmin } = require("../middleware/verifyRole");

const router = express.Router();

// Get logged-in user's profile
router.get("/me", verifyToken, getMyProfile);

// Update logged-in user's profile
router.patch("/me", verifyToken, updateMyProfile);

// Get all users (Admin only)
router.get("/", verifyToken, verifyAdmin, getAllUsers);

// Update user role (Admin only)
router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);

// Block or unblock user (Admin only)
router.patch("/:id/block", verifyToken, verifyAdmin, updateUserBlockStatus);

module.exports = router;
