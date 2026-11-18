
const express = require("express");

const {
  createEquipment,
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

// Get all approved equipment
router.get("/", getApprovedEquipment);

// Get all equipment (Admin only)
router.get("/admin/all", verifyToken, verifyAdmin, getAllEquipment);

// Update equipment status (Admin only)
router.patch(
  "/admin/:id/status",
  verifyToken,
  verifyAdmin,
  updateEquipmentStatus
);

// Get single equipment
router.get("/:id", getEquipmentById);

module.exports = router;
