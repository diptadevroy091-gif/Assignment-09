
const Equipment = require("../models/Equipment");
const User = require("../models/User");

// Create new equipment (Owner only)
const createEquipment = async (req, res) => {
  try {
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
      message: "Equipment added successfully! Waiting for admin approval.",
      data: equipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get owner's own equipment
const getMyEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find({
      "ownerInfo.userId": req.user.id,
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

// Update owner's own equipment
const updateMyEquipment = async (req, res) => {
  try {
    const allowedFields = [
      "equipmentName",
      "description",
      "category",
      "location",
      "rentalPrice",
      "rentalType",
      "availableQuantity",
      "condition",
      "brand",
      "model",
      "imageUrl",
      "rentalTerms",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid equipment information provided!",
      });
    }

    const equipment = await Equipment.findOne({
      _id: req.params.id,
      "ownerInfo.userId": req.user.id,
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found or you are not the owner!",
      });
    }

    Object.assign(equipment, updateData);

    // Edited equipment needs admin approval again
    equipment.status = "Pending";

    await equipment.save();

    res.status(200).json({
      success: true,
      message: "Equipment updated successfully! Waiting for admin approval.",
      data: equipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete owner's own equipment
const deleteMyEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findOneAndDelete({
      _id: req.params.id,
      "ownerInfo.userId": req.user.id,
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found or you are not the owner!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Equipment deleted successfully!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid equipment ID!",
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
  getMyEquipment,
  updateMyEquipment,
  deleteMyEquipment,
  getApprovedEquipment,
  getEquipmentById,
  getAllEquipment,
  updateEquipmentStatus,
};
