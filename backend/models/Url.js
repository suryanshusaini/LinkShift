const mongoose = require("mongoose");

const RETENTION_DAYS = 30;
const retentionDate = () => new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true, maxlength: 2048 },
  shortId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  clicks: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date, default: null, index: true },
  lastAccessedAt: { type: Date, default: Date.now },
  retentionExpiresAt: { type: Date, default: retentionDate, index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ retentionExpiresAt: 1 }, { expireAfterSeconds: 0 });

urlSchema.methods.touchRetention = function () {
  this.lastAccessedAt = new Date();
  this.retentionExpiresAt = retentionDate();
  return this;
};

module.exports = mongoose.model("Url", urlSchema);
