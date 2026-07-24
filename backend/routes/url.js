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
router.get("/dashboard", optionalAuth, async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const urls = await Url.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE route to remove a URL
router.delete("/:id", optionalAuth, async (req, res) => {
  // 1. Make sure they are logged in
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 2. Find the URL by its ID AND the user's ID, then delete it
    const deletedUrl = await Url.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedUrl) {
      return res
        .status(404)
        .json({
          error: "URL not found or you don't have permission to delete it",
        });
    }

    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
