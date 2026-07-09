const mongoose = require("mongoose");

// Define the structure of our URL documents in the database
const urlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true, // Ensures no two URLs share the same short ID
  },
  originalUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0, // Starts at 0 clicks
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compile the schema into a model and export it
module.exports = mongoose.model("Url", urlSchema);
