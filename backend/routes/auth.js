const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Url = require("../models/Url");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many attempts. Please try again later." } });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const signToken = (user) => jwt.sign({ userId: user._id, name: user.name || "", email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try { req.userId = jwt.verify(header.slice(7), process.env.JWT_SECRET).userId; next(); }
  catch { return res.status(401).json({ message: "Invalid or expired token" }); }
};

router.post("/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !email.includes("@")) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), emailVerified: false });
    return res.status(201).json({ token: signToken(user), email: user.email, name: user.name });
  } catch (error) { console.error("Register error:", error.message); return res.status(500).json({ message: "Server error." }); }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials." });
    return res.json({ token: signToken(user), email: user.email, name: user.name });
  } catch (error) { return res.status(500).json({ message: "Server error." }); }
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google Sign-In is not configured." });
    const credential = req.body.credential;
    if (!credential) return res.status(400).json({ message: "No credential provided." });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name } = ticket.getPayload();
    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });
    if (!user) user = await User.create({ name: name || "", email: normalizedEmail, googleId, emailVerified: true });
    else {
      if (!user.googleId) user.googleId = googleId;
      user.emailVerified = true;
      if (!user.name) user.name = name || "";
      await user.save();
    }
    return res.json({ token: signToken(user), email: user.email, name: user.name });
  } catch (error) { console.error("Google auth error:", error.message); return res.status(401).json({ message: "Invalid Google credential." }); }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("_id name email emailVerified googleId createdAt").lean();
  if (!user) return res.status(401).json({ message: "User not found." });
  return res.json(user);
});

router.post("/logout", requireAuth, (req, res) => res.json({ message: "Logged out successfully." }));

router.delete("/account", requireAuth, async (req, res) => {
  try {
    await Url.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    return res.json({ message: "Account deleted successfully." });
  } catch (error) { return res.status(500).json({ message: "Server error. Please try again." }); }
});

module.exports = router;
