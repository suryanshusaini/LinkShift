const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Url = require("../models/Url");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: sign app JWT ─────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { userId: user._id, name: user.name || "", email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

// ─── Helper: require authenticated user (strict — unlike optionalAuth) ────────
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET,
    );
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name: name || "", email, password: hashedPassword });
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "This account uses Google Sign-In." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ token, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "No credential provided" });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Upsert: find by googleId or email, create if missing
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = new User({ name: name || "", email, googleId });
      await user.save();
    } else if (!user.googleId) {
      // Existing email/password user — link their Google account
      user.googleId = googleId;
      if (!user.name) user.name = name || "";
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, email: user.email, name: user.name });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// ─── Delete Account ───────────────────────────────────────────────────────────
// Protected: JWT required. Cascades — removes all user's URLs first, then the
// user document itself. Returns 200 so the client can clear state and redirect.
router.delete("/account", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Delete every shortened URL owned by this user
    await Url.deleteMany({ userId });

    // 2. Delete the user document
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Account deletion error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

module.exports = router;
