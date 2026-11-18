
const Equipment = require("../models/Equipment");

// Create new equipment
const createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);

    res.status(201).json({
      success: true,
      message: "Equipment added successfully!",
      data: equipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all approved equipment
const getApprovedEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find({ status: "Approved" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: equipment.length,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single equipment by ID
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid equipment ID!",
    });
  }
};

// Get all equipment for Admin
const getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: equipment.length,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update equipment status (Admin)
const updateEquipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment status!",
      });
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: `Equipment ${status.toLowerCase()} successfully!`,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEquipment,
  getApprovedEquipment,
  getEquipmentById,
  getAllEquipment,
  updateEquipmentStatus,
};
