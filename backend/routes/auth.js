const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Url = require("../models/Url");
const ClickEvent = require("../models/ClickEvent");
const Session = require("../models/Session");
const { createSession, clearSessionCookies, csrfEndpoint, sessionAuth, hash } = require("../middleware/sessionAuth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many attempts. Please try again later." } });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: "Too many verification attempts. Please try again later." } });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: "Too many password recovery requests. Please try again later." } });
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const hashOtp = (email, code) => crypto.createHash("sha256").update(email + ":" + code + ":" + process.env.JWT_SECRET).digest("hex");
const genericRecovery = { message: "If an account exists for that email, recovery instructions will be sent." };

const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const mailer = getMailer();
  if (!mailer) {
    if (process.env.NODE_ENV === "production") throw new Error("Email delivery is not configured.");
    console.warn("Development mail preview for", to, subject, text);
    return false;
  }
  await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
  return true;
};

const publicUser = (user) => ({ id: String(user._id), email: user.email, name: user.name || "", emailVerified: Boolean(user.emailVerified) });
const startSession = async (user, res) => {
  const csrfToken = await createSession(user, res);
  return { user: publicUser(user), csrfToken };
};

router.get("/csrf", csrfEndpoint);

router.post("/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!name || name.length > 100) return res.status(400).json({ message: "Enter a name of 1–100 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 12 || password.length > 128) return res.status(400).json({ message: "Use a password between 12 and 128 characters." });

    const existing = await User.findOne({ email });
    if (existing?.emailVerified) return res.status(409).json({ message: "An account with this email already exists. Please sign in." });
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const now = new Date();
    let user = existing;
    if (!user) user = new User({ name, email, password: await bcrypt.hash(password, 12), emailVerified: false });
    else {
      user.name = name;
      user.password = await bcrypt.hash(password, 12);
    }
    user.verificationCodeHash = hashOtp(email, code);
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.verificationAttempts = 0;
    user.verificationResendAt = new Date(Date.now() + 60 * 1000);
    await user.save();

    try {
      const delivered = await sendMail({
        to: email,
        subject: "Verify your LinkShift email",
        text: "Your LinkShift verification code is " + code + ". It expires in 10 minutes. If you did not request this, ignore this email.",
        html: "<p>Your LinkShift verification code is:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">" + code + "</p><p>This code expires in 10 minutes.</p>",
      });
      if (!delivered && process.env.NODE_ENV !== "production") return res.status(201).json({ verificationRequired: true, email, devOtp: code, message: "Enter the development OTP to verify your email." });
    } catch (error) {
      console.error("Verification email delivery failed:", error.message);
      return res.status(503).json({ message: "We could not send the verification email. Please try again shortly." });
    }
    return res.status(201).json({ verificationRequired: true, email, message: "Check your inbox for a verification code." });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Unable to create your account right now." });
  }
});

router.post("/verify-email", otpLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();
    if (!/^[0-9]{6}$/.test(code)) return res.status(400).json({ message: "Enter the six-digit code." });
    const user = await User.findOne({ email, emailVerified: false });
    if (!user || !user.verificationCodeHash || !user.verificationExpires || user.verificationExpires <= new Date()) {
      return res.status(400).json({ message: "This code is invalid or expired. Request a new code." });
    }
    if (user.verificationAttempts >= 5) return res.status(429).json({ message: "Too many incorrect codes. Request a new code." });
    if (hashOtp(email, code) !== user.verificationCodeHash) {
      user.verificationAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "This code is invalid or expired." });
    }
    user.emailVerified = true;
    user.verificationCodeHash = null;
    user.verificationExpires = null;
    user.verificationAttempts = 0;
    user.verificationResendAt = null;
    await user.save();
    return res.json(await startSession(user, res));
  } catch (error) {
    console.error("Email verification error:", error.message);
    return res.status(500).json({ message: "Unable to verify your email right now." });
  }
});

router.post("/resend-verification", otpLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email, emailVerified: false });
    if (!user) return res.json({ message: "If verification is pending, a new code will be sent." });
    if (user.verificationResendAt && user.verificationResendAt > new Date()) return res.status(429).json({ message: "Please wait before requesting another code." });
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    user.verificationCodeHash = hashOtp(email, code);
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.verificationAttempts = 0;
    user.verificationResendAt = new Date(Date.now() + 60 * 1000);
    await user.save();
    const delivered = await sendMail({ to: email, subject: "Your LinkShift verification code", text: "Your verification code is " + code + ". It expires in 10 minutes.", html: "<p>Your verification code is:</p><strong>" + code + "</strong><p>Expires in 10 minutes.</p>" });
    return res.json({ message: "If verification is pending, a new code will be sent.", ...(!delivered && process.env.NODE_ENV !== "production" ? { devOtp: code } : {}) });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    return res.status(503).json({ message: "Unable to send a new code right now." });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid email or password." });
    if (!user.emailVerified) return res.status(403).json({ message: "Verify your email before signing in.", verificationRequired: true, email: user.email });
    return res.json(await startSession(user, res));
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to sign in right now." });
  }
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google Sign-In is not configured." });
    if (!req.body.credential) return res.status(400).json({ message: "No credential provided." });
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) return res.status(401).json({ message: "Google could not verify this email address." });
    const googleId = payload.sub;
    const email = normalizeEmail(payload.email);
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) user = await User.create({ name: payload.name || "", email, googleId, emailVerified: true });
    else {
      if (user.googleId && user.googleId !== googleId) return res.status(409).json({ message: "This email is linked to another sign-in method." });
      user.googleId = googleId;
      user.emailVerified = true;
      if (!user.name) user.name = payload.name || "";
      await user.save();
    }
    return res.json(await startSession(user, res));
  } catch (error) {
    console.error("Google auth error:", error.message);
    return res.status(401).json({ message: "Google sign-in could not be completed." });
  }
});

router.get("/me", sessionAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("_id name email emailVerified googleId createdAt").lean();
  if (!user) return res.status(401).json({ message: "Please sign in again." });
  return res.json(publicUser(user));
});

router.post("/forgot-password", resetLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email, password: { $exists: true, $ne: null } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("base64url");
      user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const base = process.env.FRONTEND_URL;
      const resetUrl = base + "/reset-password?token=" + encodeURIComponent(rawToken);
      try {
        const delivered = await sendMail({
          to: user.email,
          subject: "Reset your LinkShift password",
          text: "Reset your password using this single-use link: " + resetUrl + ". It expires in 30 minutes.",
          html: "<p>Reset your LinkShift password.</p><p><a href=\"" + resetUrl + "\">Choose a new password</a></p><p>This single-use link expires in 30 minutes.</p>",
        });
        if (!delivered && process.env.NODE_ENV !== "production") return res.json({ ...genericRecovery, devResetToken: rawToken });
      } catch (error) {
        console.error("Password reset email delivery failed:", error.message);
        return res.status(503).json({ message: "Recovery email could not be sent. Please try again shortly." });
      }
    }
    return res.json(genericRecovery);
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ message: "Unable to process recovery right now." });
  }
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || password.length < 12 || password.length > 128) return res.status(400).json({ message: "Use a valid reset link and a password between 12 and 128 characters." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetTokenHash: tokenHash, resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired." });
    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = new Date();
    user.resetTokenHash = null;
    user.resetExpires = null;
    await user.save();
    await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    await sendMail({
      to: user.email,
      subject: "Your LinkShift password was changed",
      text: "Your LinkShift password was changed. If you did not do this, contact support immediately.",
      html: "<p>Your LinkShift password was changed.</p><p>If you did not do this, contact support immediately.</p>",
    }).catch((error) => console.error("Password-change notification failed:", error.message));
    return res.json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ message: "Unable to reset your password right now." });
  }
});

router.post("/change-password", sessionAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 12 || newPassword.length > 128) return res.status(400).json({ message: "Use a password between 12 and 128 characters." });
    const user = await User.findById(req.userId);
    if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: "Current password is incorrect." });
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();
    await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearSessionCookies(res);
    return res.json({ message: "Password changed. Please sign in again." });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Unable to change your password right now." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { parseCookies, SESSION_COOKIE, hash: hashValue } = require("../middleware/sessionAuth");
    const cookies = parseCookies(req.headers.cookie);
    if (cookies[SESSION_COOKIE]) await Session.updateOne({ tokenHash: hashValue(cookies[SESSION_COOKIE]), revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearSessionCookies(res);
    return res.json({ message: "Logged out successfully." });
  } catch (error) {
    clearSessionCookies(res);
    return res.status(500).json({ message: "Unable to complete logout." });
  }
});

router.delete("/account", sessionAuth, async (req, res) => {
  try {
    const links = await Url.find({ userId: req.userId }).select("_id").lean();
    if (links.length) await ClickEvent.deleteMany({ urlId: { $in: links.map((link) => link._id) } });
    await Url.deleteMany({ userId: req.userId });
    await Session.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    clearSessionCookies(res);
    return res.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Account deletion error:", error.message);
    return res.status(500).json({ message: "Unable to delete account right now." });
  }
});

module.exports = router;
