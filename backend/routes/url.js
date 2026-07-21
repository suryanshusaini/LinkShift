const express = require("express");
const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const optionalAuth = require("../middleware/auth"); // 1. Import the middleware

const router = express.Router();

// 2. Add 'optionalAuth' to the route right before the async (req, res) function
router.post("/shorten", optionalAuth, async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Please provide a valid URL" });
  }

  try {
    // Check if this exact long URL is already in the database
    let existingUrl = await Url.findOne({ originalUrl });
    if (existingUrl) {
      return res.json(existingUrl);
    }

    // Generate a unique 6-character short ID
    const shortId = nanoid(6);

    // Create a new document in the database
    const newUrl = new Url({
      originalUrl,
      shortId,
      userId: req.userId, // 3. Attach the user's ID! (This will be null if they aren't logged in)
    });

    await newUrl.save();

    res.status(201).json(newUrl);
  } catch (error) {
    console.error("Error generating short URL:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
