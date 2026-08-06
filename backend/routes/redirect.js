const express = require("express");
const router = express.Router();
const Url = require("../models/Url");

// Reserved prefixes that must never be treated as short IDs.
// This guard makes the redirect route safe to mount at '/' regardless of
// future changes to route ordering in server.js.
const RESERVED_PREFIXES = ["/api", "/health", "/favicon.ico"];

router.get("/:shortId", async (req, res) => {
  const fullPath = req.originalUrl;

  // If the path starts with any reserved prefix, skip this handler and
  // let Express fall through to a 404 (or another matching route).
  const isReserved = RESERVED_PREFIXES.some((prefix) =>
    fullPath.startsWith(prefix),
  );
  if (isReserved) {
    return res.status(404).json({ error: "Route not found." });
  }

  try {
    const { shortId } = req.params;

    // Atomically find the document, increment the click counter, and
    // reset the TTL expiry window in a single DB round-trip.
    // Updating lastAccessedAt to now() ensures the 30-day inactivity
    // clock restarts on every click — active links will never be purged.
    const url = await Url.findOneAndUpdate(
      { shortId },
      {
        $inc: { clicks: 1 },
        $set: { lastAccessedAt: new Date() },
      },
      { new: true },
    );

    if (url) {
      // 302: Temporary redirect — browser won't cache it, so every visit
      // is counted. (301 would break click analytics.)
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ error: "Short URL not found." });
    }
  } catch (error) {
    console.error("Redirect error:", error.message);
    res.status(500).json({ error: "Server error during redirect." });
  }
});

module.exports = router;
