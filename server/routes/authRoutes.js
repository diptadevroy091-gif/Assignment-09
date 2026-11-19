
const express = require("express");
const passport = require("passport");
const { generateToken } = require("../config/passport");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Handle successful Google/GitHub login
const handleOAuthSuccess = (req, res) => {
  const token = generateToken(req.user);

  const userData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    photoURL: req.user.photoURL || "",
  };

  const clientURL =
    process.env.CLIENT_URL || "http://localhost:3000";

  const user = encodeURIComponent(JSON.stringify(userData));

  res.redirect(
    `${clientURL}/auth/callback#token=${encodeURIComponent(token)}&user=${user}`
  );
};

// Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/oauth-failed",
  }),
  handleOAuthSuccess
);

// GitHub Login
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/api/auth/oauth-failed",
  }),
  handleOAuthSuccess
);

// OAuth failure
router.get("/oauth-failed", (req, res) => {
  res.status(401).send("Social login failed. Please try again.");
});

module.exports = router;
