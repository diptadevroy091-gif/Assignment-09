
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected!");

    // Find your existing account by email
    const email = "diptadevroy36@gmail.com";

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found! Please check your email.");
      return;
    }

    // Promote account to Admin
    user.role = "Admin";
    user.isBlocked = false;

    await user.save();

    console.log("Admin role assigned successfully!");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

makeAdmin();
