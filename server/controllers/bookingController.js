
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");
const User = require("../models/User");
const Payment = require("../models/Payment");

// Create Booking (Customer)
const createBooking = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
      quantity,
      contactNumber,
      deliveryAddress,
      notes,
    } = req.body;

    if (
      !equipmentId ||
      !startDate ||
      !endDate ||
      !quantity ||
      !contactNumber ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking information.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    if (equipment.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "This equipment is not available for booking.",
      });
    }

    const customer = await User.findById(req.user.id);

    if (!customer || customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked or unavailable.",
      });
    }

    const bookingStart = new Date(startDate);
    const bookingEnd = new Date(endDate);
    const bookingQuantity = Number(quantity);

    if (
      Number.isNaN(bookingStart.getTime()) ||
      Number.isNaN(bookingEnd.getTime()) ||
      bookingEnd <= bookingStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select valid rental dates.",
      });
    }

    if (
      !Number.isInteger(bookingQuantity) ||
      bookingQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid quantity.",
      });
    }

    if (bookingQuantity > equipment.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.availableQuantity} units are available.`,
      });
    }

    const durationInMs = bookingEnd - bookingStart;
    const durationInDays = Math.ceil(
      durationInMs / (1000 * 60 * 60 * 24)
    );

    let rentalUnits = durationInDays;

    if (equipment.rentalType === "Weekly") {
      rentalUnits = Math.ceil(durationInDays / 7);
    } else if (equipment.rentalType === "Monthly") {
      rentalUnits = Math.ceil(durationInDays / 30);
    }

    const totalAmount =
      Number(equipment.rentalPrice) *
      rentalUnits *
      bookingQuantity;

    const ownerId = equipment.ownerInfo?.userId;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Equipment owner information is missing.",
      });
    }

    const booking = await Booking.create({
      equipmentId: equipment._id,

      customerInfo: {
        userId: req.user.id,
        name: customer.name,
        email: customer.email,
      },

      ownerId: String(ownerId),

      startDate: bookingStart,
      endDate: bookingEnd,
      quantity: bookingQuantity,
      contactNumber,
      deliveryAddress,
      notes: notes || "",

      totalAmount,

      paymentStatus: "Pending",
      bookingStatus: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Customer's Bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      "customerInfo.userId": req.user.id,
    })
      .populate("equipmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Bookings (Admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("equipmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Owner's Equipment Rentals
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      ownerId: String(req.user.id),
    })
      .populate("equipmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get Owner Bookings Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Owner Analytics
const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = String(req.user.id);

    const totalEquipment = await Equipment.countDocuments({
      "ownerInfo.userId": ownerId,
    });

    const totalBookings = await Booking.countDocuments({
      ownerId,
    });

    const completedRentals = await Booking.countDocuments({
      ownerId,
      bookingStatus: "Completed",
    });

    const paidBookings = await Booking.find({
      ownerId,
      paymentStatus: "Paid",
    });

    const totalEarnings = paidBookings.reduce(
      (total, booking) => total + Number(booking.totalAmount || 0),
      0
    );

    const monthlyEarnings = [];

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      startDate.setMonth(startDate.getMonth() - i);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const monthlyBookings = await Booking.find({
        ownerId,
        paymentStatus: "Paid",
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const earnings = monthlyBookings.reduce(
        (total, booking) =>
          total + Number(booking.totalAmount || 0),
        0
      );

      monthlyEarnings.push({
        month: startDate.toLocaleString("en-US", {
          month: "short",
        }),
        earnings,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalEquipment,
        totalBookings,
        completedRentals,
        paidBookings: paidBookings.length,
        totalEarnings,
        monthlyEarnings,
      },
    });
  } catch (error) {
    console.error("Owner Analytics Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Pending Booking (Admin only)
const deletePendingBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      booking.paymentStatus !== "Pending" ||
      booking.bookingStatus !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only unpaid pending bookings can be deleted.",
      });
    }

    await Payment.deleteMany({
      bookingId: booking._id,
      paymentStatus: "Pending",
    });

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Pending booking deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Booking Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getOwnerAnalytics,
  getOwnerBookings,
  deletePendingBooking,
};
