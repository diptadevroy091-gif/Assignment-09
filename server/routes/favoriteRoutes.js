
const express = require("express");

const {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} = require("../controllers/favoriteController");

const verifyToken = require("../middleware/verifyToken");
const { verifyCustomer } = require("../middleware/verifyRole");

const router = express.Router();

// Customer favorite routes
router.post("/", verifyToken, verifyCustomer, addFavorite);
router.get("/my-favorites", verifyToken, verifyCustomer, getMyFavorites);
router.delete("/:equipmentId", verifyToken, verifyCustomer, removeFavorite);

module.exports = router;
