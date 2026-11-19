
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: "",
      select: false,
    },

    photoURL: {
      type: String,
      default: "",
    },

    // Google OAuth ID
    googleId: {
      type: String,
      default: "",
    },

    // GitHub OAuth ID
    githubId: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["Customer", "Owner", "Admin"],
      default: "Customer",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
