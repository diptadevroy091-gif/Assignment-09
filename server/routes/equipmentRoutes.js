
const express = require("express");

const {
  createEquipment,
  getApprovedEquipment,
  getEquipmentById,
} = require("../controllers/equipmentController");

const verifyToken = require("../middleware/verifyToken");
const { verifyOwner } = require("../middleware/verifyRole");

const router = express.Router();

// Create equipment (Owner only)
router.post("/", verifyToken, verifyOwner, createEquipment);

// Get all approved equipment
router.get("/", getApprovedEquipment);

// Get single equipment
router.get("/:id", getEquipmentById);

module.exports = router;
