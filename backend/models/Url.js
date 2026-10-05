const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true, maxlength: 2048 },
  shortId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  clicks: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date, default: null, index: true },
  lastAccessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

urlSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("Url", urlSchema);
