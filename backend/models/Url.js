const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    clicks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // ─── Data Retention ───────────────────────────────────────────────────────
    // MongoDB TTL index: documents are purged 30 days after lastAccessedAt.
    // Every redirect resets this timestamp, so actively-used links never expire.
    // Zero-click links created today will be removed after 30 days of inactivity.
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      index: { expires: 2592000 }, // 2592000 seconds = 30 days
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Url", urlSchema);

