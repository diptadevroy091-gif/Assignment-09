
const Equipment = require("../models/Equipment");
const User = require("../models/User");

// Create new equipment (Owner only)
const createEquipment = async (req, res) => {
  try {
    // Find logged-in owner
    const owner = await User.findById(req.user.id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner account not found!",
      });
    }

    if (owner.role !== "Owner") {
      return res.status(403).json({
        success: false,
        message: "Only equipment owners can add equipment!",
      });
    }

    // Create equipment with verified owner information
    const equipment = await Equipment.create({
      equipmentName: req.body.equipmentName,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      rentalPrice: req.body.rentalPrice,
      rentalType: req.body.rentalType,
      availableQuantity: req.body.availableQuantity,
      condition: req.body.condition,
      brand: req.body.brand,
      model: req.body.model,
      imageUrl: req.body.imageUrl,
      rentalTerms: req.body.rentalTerms,

      ownerInfo: {
        userId: owner._id.toString(),
        name: owner.name,
        email: owner.email,
      },

      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Equipment added successfully! Waiting for admin approval.",
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
    const equipment = await Equipment.find({
      status: "Approved",
    }).sort({ createdAt: -1 });

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
    const equipment = await Equipment.find().sort({
      createdAt: -1,
    });

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

// Update equipment status (Admin only)
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
