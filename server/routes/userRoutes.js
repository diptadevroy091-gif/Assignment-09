
const express = require("express");

const {
  getAllUsers,
  updateUserRole,
  updateUserBlockStatus,
} = require("../controllers/userController");

const verifyToken = require("../middleware/verifyToken");
const { verifyAdmin } = require("../middleware/verifyRole");

const router = express.Router();

// Get all users
router.get("/", verifyToken, verifyAdmin, getAllUsers);

// Update user role
router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);

// Block or unblock user
router.patch("/:id/block", verifyToken, verifyAdmin, updateUserBlockStatus);

module.exports = router;
