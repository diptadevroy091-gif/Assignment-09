
const express = require("express");

const passport = require("passport");
const {
  generateToken,
} = require("../config/passport");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

// Register API
router.post("/register", registerUser);

// Email and Password Login
router.post("/login", loginUser);

// Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/oauth-failed",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    const clientURL =
      process.env.CLIENT_URL || "http://localhost:3000";

    res.redirect(
      `${clientURL}/auth/callback#token=${encodeURIComponent(token)}`
    );
  }
);

// GitHub Login
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

// GitHub Callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/api/auth/oauth-failed",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    const clientURL =
      process.env.CLIENT_URL || "http://localhost:3000";

    res.redirect(
      `${clientURL}/auth/callback#token=${encodeURIComponent(token)}`
    );
  }
);

// OAuth Failure
router.get("/oauth-failed", (req, res) => {
  res.status(401).send("Social login failed. Please try again.");
});

module.exports = router;
