const express = require("express");
const router = express.Router();
const Url = require("../models/Url");

router.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    // Find the URL by shortId and increment the clicks by 1 in a single step
    const url = await Url.findOneAndUpdate(
      { shortId: shortId },
      { $inc: { clicks: 1 } },
      { new: true },
    );
    if (url) {
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ error: "URL not found" });
    }
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
