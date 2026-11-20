
const Equipment = require("../models/Equipment");
const User = require("../models/User");

// ======================================
// CREATE NEW EQUIPMENT (OWNER ONLY)
// ======================================
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

// ======================================
// GET OWNER'S OWN EQUIPMENT
// ======================================
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

// ======================================
// UPDATE OWNER'S OWN EQUIPMENT
// ======================================
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

    // Edited equipment requires admin approval again
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

// ======================================
// DELETE OWNER'S OWN EQUIPMENT
// ======================================
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

// ======================================
// GET APPROVED EQUIPMENT
// SERVER-SIDE SEARCH, FILTER & SORT
// ======================================
const getApprovedEquipment = async (req, res) => {
  try {
    const {
      search = "",
      category,
      rentalType,
      minPrice,
      maxPrice,
      availability,
      sort = "newest",
    } = req.query;

    // Only approved equipment will be shown
    const query = {
      status: "Approved",
    };

    // Search by equipment name, brand or location
    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      query.$or = [
        { equipmentName: searchRegex },
        { brand: searchRegex },
        { location: searchRegex },
      ];
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Rental type filter
    if (rentalType && rentalType !== "All") {
      query.rentalType = rentalType;
    }

    // Minimum price filter
    if (minPrice !== undefined && minPrice !== "") {
      const min = Number(minPrice);

      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid minimum price!",
        });
      }

      query.rentalPrice = {
        ...query.rentalPrice,
        $gte: min,
      };
    }

    // Maximum price filter
    if (maxPrice !== undefined && maxPrice !== "") {
      const max = Number(maxPrice);

      if (!Number.isFinite(max) || max < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum price!",
        });
      }

      query.rentalPrice = {
        ...query.rentalPrice,
        $lte: max,
      };
    }

    if (
      query.rentalPrice?.$gte !== undefined &&
      query.rentalPrice?.$lte !== undefined &&
      query.rentalPrice.$gte > query.rentalPrice.$lte
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot exceed maximum price!",
      });
    }

    // Availability filter
    if (availability === "available") {
      query.availableQuantity = { $gt: 0 };
    } else if (availability === "unavailable") {
      query.availableQuantity = { $lte: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };

    if (sort === "low") {
      sortOption = { rentalPrice: 1 };
    } else if (sort === "high") {
      sortOption = { rentalPrice: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    const equipment = await Equipment.find(query).sort(sortOption);

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

// ======================================
// GET SINGLE EQUIPMENT BY ID
// ======================================
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

// ======================================
// GET ALL EQUIPMENT FOR ADMIN
// ======================================
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

// ======================================
// UPDATE EQUIPMENT STATUS (ADMIN ONLY)
// ======================================
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

// ======================================
// EXPORT CONTROLLERS
// ======================================
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
