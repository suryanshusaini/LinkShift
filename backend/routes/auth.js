const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Url = require("../models/Url");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many attempts. Please try again later." } });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: "Too many password reset requests. Please try again later." } });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const signToken = (user) => jwt.sign({ userId: user._id, name: user.name || "", email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try { req.userId = jwt.verify(header.slice(7), process.env.JWT_SECRET).userId; next(); }
  catch { return res.status(401).json({ message: "Invalid or expired token" }); }
};

const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE) === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
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
    else { if (!user.googleId) user.googleId = googleId; user.emailVerified = true; if (!user.name) user.name = name || ""; await user.save(); }
    return res.json({ token: signToken(user), email: user.email, name: user.name });
  } catch (error) { console.error("Google auth error:", error.message); return res.status(401).json({ message: "Invalid Google credential." }); }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("_id name email emailVerified googleId createdAt").lean();
  if (!user) return res.status(401).json({ message: "User not found." });
  return res.json(user);
});

router.post("/forgot-password", resetLimiter, async (req, res) => {
  const generic = { message: "If an account exists for that email, a reset link has been sent." };
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = (process.env.FRONTEND_URL || "http://localhost:5173") + "/reset-password?token=" + encodeURIComponent(rawToken);
    const mailer = getMailer();
    if (mailer) {
      await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: user.email, subject: "Reset your LinkShift password", text: "Reset your LinkShift password: " + resetUrl + "\n\nThis link expires in 30 minutes.", html: "<p>Reset your LinkShift password.</p><p><a href=\"" + resetUrl + "\">Set a new password</a></p><p>This link expires in 30 minutes.</p>" });
    } else if (process.env.NODE_ENV !== "production") {
      console.log("DEV password reset URL:", resetUrl);
      return res.json({ ...generic, devResetToken: rawToken });
    }
    return res.json(generic);
  } catch (error) { console.error("Forgot password error:", error.message); return res.json(generic); }
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || password.length < 8) return res.status(400).json({ message: "A valid token and password of at least 8 characters are required." });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetTokenHash: hash, resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired." });
    user.password = await bcrypt.hash(password, 12);
    user.resetTokenHash = null; user.resetExpires = null;
    await user.save();
    return res.json({ message: "Password updated successfully. You can now sign in." });
  } catch (error) { return res.status(500).json({ message: "Server error." }); }
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
