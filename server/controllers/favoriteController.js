
const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");
const Equipment = require("../models/Equipment");

// Add equipment to favorites
const addFavorite = async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const customerId = req.user.id;

    // Debug logs
    console.log("========== ADD FAVORITE ==========");
    console.log("ADD FAVORITE CUSTOMER ID:", customerId);
    console.log("EQUIPMENT ID:", equipmentId);

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID",
      });
    }

    const equipment = await Equipment.findOne({
      _id: equipmentId,
      status: "Approved",
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Approved equipment not found",
      });
    }

    const existingFavorite = await Favorite.findOne({
      customerId,
      equipmentId,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: "This equipment is already in your favorites",
      });
    }

    const favorite = await Favorite.create({
      customerId,
      equipmentId,
    });

    console.log("FAVORITE SAVED SUCCESSFULLY:", favorite._id);
    console.log("==================================");

    return res.status(201).json({
      success: true,
      message: "Equipment added to favorites successfully",
      data: favorite,
    });
  } catch (error) {
    console.error("ADD FAVORITE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This equipment is already in your favorites",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add favorite",
      error: error.message,
    });
  }
};

// Get logged-in customer's favorites
const getMyFavorites = async (req, res) => {
  try {
    const customerId = req.user.id;

    console.log("========== GET MY FAVORITES ==========");
    console.log("GET FAVORITES CUSTOMER ID:", customerId);

    const favorites = await Favorite.find({
      customerId,
    })
      .populate("equipmentId")
      .sort({ createdAt: -1 });

    console.log("TOTAL FAVORITES FROM DATABASE:", favorites.length);

    const validFavorites = favorites.filter(
      (favorite) => favorite.equipmentId
    );

    console.log("VALID FAVORITES:", validFavorites.length);
    console.log("======================================");

    return res.status(200).json({
      success: true,
      total: validFavorites.length,
      data: validFavorites,
    });
  } catch (error) {
    console.error("GET FAVORITES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get favorites",
      error: error.message,
    });
  }
};

// Remove equipment from favorites
const removeFavorite = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const customerId = req.user.id;

    console.log("========== REMOVE FAVORITE ==========");
    console.log("CUSTOMER ID:", customerId);
    console.log("EQUIPMENT ID:", equipmentId);

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID",
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      customerId,
      equipmentId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    console.log("FAVORITE REMOVED:", favorite._id);
    console.log("=====================================");

    return res.status(200).json({
      success: true,
      message: "Favorite removed successfully",
    });
  } catch (error) {
    console.error("REMOVE FAVORITE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove favorite",
      error: error.message,
    });
  }
};

module.exports = {
  addFavorite,
  getMyFavorites,
  removeFavorite,
};
