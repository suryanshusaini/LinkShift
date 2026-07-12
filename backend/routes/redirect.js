const express = require("express");
const router = express.Router();
const Url = require("../models/Url");

// The GET Route for Redirection (MongoDB only, no Redis)
router.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    // 1. Find the URL document in MongoDB
    const urlDoc = await Url.findOne({ shortId });

    if (urlDoc) {
      // 2. Increment the click analytics and save
      urlDoc.clicks++;
      await urlDoc.save();

      // 3. Perform the actual HTTP redirect to the long URL!
      return res.redirect(urlDoc.originalUrl);
    } else {
      // If the ID doesn't exist in the database
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

module.exports = router;
