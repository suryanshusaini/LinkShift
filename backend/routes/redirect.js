const express = require("express");
const router = express.Router();
const Url = require("../models/Url");

const RESERVED_PREFIXES = ["/api", "/health", "/favicon.ico"];

router.get("/:shortId", async (req, res) => {
  if (RESERVED_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix))) {
    return res.status(404).json({ error: "Route not found." });
  }

  try {
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId, isActive: true, deletedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      { $inc: { clicks: 1 }, $set: { lastAccessedAt: new Date(), retentionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      { new: true },
    );
    if (!url) return res.status(404).json({ error: "Short URL not found or expired." });
    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error.message);
    return res.status(500).json({ error: "Server error during redirect." });
  }
});

module.exports = router;
