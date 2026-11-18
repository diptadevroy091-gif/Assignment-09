
const express = require("express");

const {
  createEquipment,
  getApprovedEquipment,
  getEquipmentById,
} = require("../controllers/equipmentController");

const router = express.Router();

// Create equipment
router.post("/", createEquipment);

// Get all approved equipment
router.get("/", getApprovedEquipment);

// Get single equipment
router.get("/:id", getEquipmentById);

module.exports = router;
