
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized! Please login first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden! You do not have permission.",
      });
    }

    next();
  };
};

// Role-specific middleware
const verifyOwner = verifyRole("Owner");
const verifyAdmin = verifyRole("Admin");
const verifyCustomer = verifyRole("Customer");

module.exports = {
  verifyRole,
  verifyOwner,
  verifyAdmin,
  verifyCustomer,
};
