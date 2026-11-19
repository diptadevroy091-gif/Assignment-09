
const express = require("express");

const {
  createEquipment,
  getMyEquipment,
  updateMyEquipment,
  deleteMyEquipment,
  getApprovedEquipment,
  getEquipmentById,
  getAllEquipment,
  updateEquipmentStatus,
} = require("../controllers/equipmentController");

const verifyToken = require("../middleware/verifyToken");

const {
  verifyOwner,
  verifyAdmin,
} = require("../middleware/verifyRole");

const router = express.Router();

// Create equipment (Owner only)
router.post("/", verifyToken, verifyOwner, createEquipment);

// Get logged-in owner's own equipment
router.get(
  "/my-equipment",
  verifyToken,
  verifyOwner,
  getMyEquipment
);

// Update owner's own equipment
router.patch(
  "/my-equipment/:id",
  verifyToken,
  verifyOwner,
  updateMyEquipment
);

// Delete owner's own equipment
router.delete(
  "/my-equipment/:id",
  verifyToken,
  verifyOwner,
  deleteMyEquipment
);

// Get all approved equipment (Public)
router.get("/", getApprovedEquipment);

// Get all equipment (Admin only)
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  getAllEquipment
);

// Update equipment status (Admin only)
router.patch(
  "/admin/:id/status",
  verifyToken,
  verifyAdmin,
  updateEquipmentStatus
);

// Get single equipment by ID
router.get("/:id", getEquipmentById);

module.exports = router;
