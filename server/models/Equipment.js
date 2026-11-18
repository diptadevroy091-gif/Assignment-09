
const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    equipmentName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Construction Equipment",
        "Photography Equipment",
        "Vehicles & Transportation",
        "Agriculture Equipment",
        "Electronics",
        "Event Equipment",
      ],
    },

    location: {
      type: String,
      required: true,
    },

    rentalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    rentalType: {
      type: String,
      required: true,
      enum: ["Daily", "Weekly", "Monthly"],
    },

    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    condition: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    rentalTerms: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    ownerInfo: {
      userId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Equipment = mongoose.model("Equipment", equipmentSchema);

module.exports = Equipment;
