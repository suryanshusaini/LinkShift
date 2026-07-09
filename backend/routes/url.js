const express = require("express");
const { nanoid } = require("nanoid");
const Url = require("../models/Url"); // Import the Mongoose model we just made

const router = express.Router();

// @route   POST /api/shorten
// @desc    Create a short URL
router.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  // 1. Basic Validation: Ensure a URL was provided
  if (!originalUrl) {
    return res.status(400).json({ error: "Please provide a valid URL" });
  }

  // Optional: You can add stricter URL validation here using regex or the URL constructor

  try {
    // 2. Check if this exact long URL is already in the database
    let existingUrl = await Url.findOne({ originalUrl });
    if (existingUrl) {
      // If it exists, just return the existing short ID
      return res.json(existingUrl);
    }

    // 3. Generate a unique 6-character short ID
    const shortId = nanoid(6);

    // 4. Create a new document in the database
    const newUrl = new Url({
      originalUrl,
      shortId,
      // clicks will default to 0, createdAt will default to Date.now()
    });

    await newUrl.save(); // Save it to MongoDB

    // 5. Send the newly created database record back to the frontend
    res.status(201).json(newUrl);
  } catch (error) {
    console.error("Error generating short URL:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
