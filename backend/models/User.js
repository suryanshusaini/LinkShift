const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  // Legacy users without this field remain verified; password signups explicitly set false.
  emailVerified: { type: Boolean, default: true },
  verificationCodeHash: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  verificationAttempts: { type: Number, default: 0 },
  verificationResendAt: { type: Date, default: null },
  resetTokenHash: { type: String, default: null },
  resetExpires: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("User", userSchema);
