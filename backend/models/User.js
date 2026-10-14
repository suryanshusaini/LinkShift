const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  resetTokenHash: { type: String, default: null },
  resetExpires: { type: Date, default: null },
  verificationCodeHash: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  verificationAttempts: { type: Number, default: 0 },
  verificationResendAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
