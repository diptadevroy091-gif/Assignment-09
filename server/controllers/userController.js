
const User = require("../models/User");

// ======================================
// GET ALL USERS (ADMIN)
// ======================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// UPDATE USER ROLE (ADMIN)
// ======================================
const updateUserRole = async (req, res) => {
  try {
    // Admin cannot change their own role
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own Admin role!",
      });
    }

    const { role } = req.body;

    if (!["Customer", "Owner", "Admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role!",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// BLOCK / UNBLOCK USER (ADMIN)
// ======================================
const updateUserBlockStatus = async (req, res) => {
  try {
    // Admin cannot block their own account
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot block your own Admin account!",
      });
    }

    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isBlocked must be true or false!",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: isBlocked
        ? "User blocked successfully!"
        : "User unblocked successfully!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// GET MY PROFILE
// ======================================
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// UPDATE MY PROFILE
// ======================================
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "photoURL", "phone", "address"];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} value!`,
          });
        }

        updateData[field] = req.body[field].trim();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile information!",
      });
    }

    if (updateData.name !== undefined && !updateData.name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty!",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found!",
      });
    }

    Object.assign(user, updateData);

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: safeUser,
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
  getAllUsers,
  updateUserRole,
  updateUserBlockStatus,
  getMyProfile,
  updateMyProfile,
};
