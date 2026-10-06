const mongoose = require("mongoose");

const clickEventSchema = new mongoose.Schema({
  urlId: { type: mongoose.Schema.Types.ObjectId, ref: "Url", required: true, index: true },
  clickedAt: { type: Date, default: Date.now, index: true },
  referrer: { type: String, default: "Direct", maxlength: 512 },
  device: { type: String, default: "Unknown", maxlength: 32 },
  browser: { type: String, default: "Unknown", maxlength: 32 },
  os: { type: String, default: "Unknown", maxlength: 32 },
}, { versionKey: false });

clickEventSchema.index({ urlId: 1, clickedAt: -1 });

module.exports = mongoose.model("ClickEvent", clickEventSchema);
