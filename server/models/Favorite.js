
const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },

    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same customer cannot favorite the same equipment twice
favoriteSchema.index(
  { customerId: 1, equipmentId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Favorite", favoriteSchema);
