
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error("Google account email not available"));
        }

        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email },
          ],
        });

        if (user?.isBlocked) {
          return done(null, false, {
            message: "Your account has been blocked!",
          });
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName || "Google User",
            email,
            googleId: profile.id,
            photoURL: profile.photos?.[0]?.value || "",
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.photoURL =
            user.photoURL || profile.photos?.[0]?.value || "";
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const profileEmail = profile.emails?.find(
          (item) => item.primary
        )?.value || profile.emails?.[0]?.value;

        const email = profileEmail?.toLowerCase();

        if (!email) {
          return done(new Error("GitHub account email not available"));
        }

        let user = await User.findOne({
          $or: [
            { githubId: profile.id },
            { email },
          ],
        });

        if (user?.isBlocked) {
          return done(null, false, {
            message: "Your account has been blocked!",
          });
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            githubId: profile.id,
            photoURL: profile.photos?.[0]?.value || "",
          });
        } else if (!user.githubId) {
          user.githubId = profile.id;
          user.photoURL =
            user.photoURL || profile.photos?.[0]?.value || "";
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = {
  passport,
  generateToken,
};
