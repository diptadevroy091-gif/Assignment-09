
const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");
const User = require("../models/User");

// Create new booking (Customer only)
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

    // Validate required fields
    if (
      !equipmentId ||
      !startDate ||
      !endDate ||
      quantity === undefined ||
      !contactNumber ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking information!",
      });
    }

    // Validate equipment ID
    if (!/^[0-9a-fA-F]{24}$/.test(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID!",
      });
    }

    // Find approved equipment
    const equipment = await Equipment.findOne({
      _id: equipmentId,
      status: "Approved",
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found or not available!",
      });
    }

    // Find logged-in customer
    const customer = await User.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found!",
      });
    }

    if (customer.isBlocked || customer.role !== "Customer") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create a booking!",
      });
    }

    // Validate rental dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid rental dates!",
      });
    }

    // Validate quantity
    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > equipment.availableQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity is not available!",
      });
    }

    // Calculate rental duration
    const duration = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );

    let rentalUnits = duration;

    if (equipment.rentalType === "Weekly") {
      rentalUnits = Math.ceil(duration / 7);
    } else if (equipment.rentalType === "Monthly") {
      rentalUnits = Math.ceil(duration / 30);
    }

    // Calculate total rental amount
    const totalAmount =
      equipment.rentalPrice *
      rentalUnits *
      requestedQuantity;

    // Create booking
    const booking = await Booking.create({
      equipmentId: equipment._id,

      customerInfo: {
        userId: customer._id.toString(),
        name: customer.name,
        email: customer.email,
      },

      ownerId: equipment.ownerInfo.userId,

      startDate: start,
      endDate: end,
      quantity: requestedQuantity,

      contactNumber: contactNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      notes: notes || "",

      totalAmount,
      paymentStatus: "Pending",
      bookingStatus: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Booking created. Please complete payment!",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get logged-in customer's bookings
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

// Get all bookings (Admin only)
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

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
};
