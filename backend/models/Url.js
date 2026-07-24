const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortId: { type: String, required: true, unique: true },
    clicks: { type: Number, default: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastOpenedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
); // automatically gives us createdAt and updatedAt

module.exports = mongoose.model("Url", urlSchema);
