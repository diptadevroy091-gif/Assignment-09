
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const makeOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected!");

    // এখানে নতুন Account-এর Email বসাবে
    const email = "roydipta116@gmail.com";

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      console.log("User not found! Check the email.");
      return;
    }

    user.role = "Owner";
    user.isBlocked = false;

    await user.save();

    console.log("Owner role assigned successfully!");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
  } catch (error) {
    console.error("Owner creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

makeOwner();
