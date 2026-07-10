const express = require("express");
const Url = require("../models/Url");
const { client: redisClient } = require("../config/redis");

const router = express.Router();

// How long (in seconds) a short URL stays cached in Redis.
// 3600 = 1 hour. After this, Redis evicts the key and the next
// request falls back to MongoDB, refreshing the cache.
const CACHE_TTL_SECONDS = 3600;

// @route   GET /:shortId
// @desc    Look up a short ID and redirect to the original URL
// @access  Public
router.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Check the Redis cache first (Cache-Aside pattern)
    //
    // We use the shortId as the Redis key. If we find it, that's a "Cache Hit"
    // — we can skip the database entirely and redirect instantly.
    // ─────────────────────────────────────────────────────────────────────────
    let cachedUrl = null;

    if (redisClient.isReady) {
      cachedUrl = await redisClient.get(shortId);
    }

    if (cachedUrl) {
      // ── CACHE HIT ──────────────────────────────────────────────────────────
      // We found the URL in Redis. No database query needed.
      // Increment clicks in the background (don't await — we don't want
      // the click counter to slow down the redirect for the user).
      Url.updateOne({ shortId }, { $inc: { clicks: 1 } }).catch((err) =>
        console.error("Click increment error:", err.message)
      );

      console.log(`[CACHE HIT]  /${shortId} → ${cachedUrl}`);
      return res.redirect(cachedUrl);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Cache Miss — the key wasn't in Redis, so query MongoDB
    // ─────────────────────────────────────────────────────────────────────────
    const urlDoc = await Url.findOneAndUpdate(
      { shortId },                    // find the document by shortId
      { $inc: { clicks: 1 } },        // atomically increment clicks by 1
      { new: true }                   // return the updated document
    );

    if (!urlDoc) {
      // The shortId doesn't exist in the database at all → 404
      return res.status(404).json({ error: `Short URL '${shortId}' not found.` });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Populate the cache so the NEXT request is a Cache Hit
    //
    // We store originalUrl string against the shortId key with an expiry (TTL).
    // After CACHE_TTL_SECONDS seconds Redis automatically deletes this key.
    // EX = "expire in X seconds"
    // ─────────────────────────────────────────────────────────────────────────
    if (redisClient.isReady) {
      await redisClient.set(shortId, urlDoc.originalUrl, { EX: CACHE_TTL_SECONDS });
    }

    console.log(`[CACHE MISS] /${shortId} → ${urlDoc.originalUrl} (cached for ${CACHE_TTL_SECONDS}s)`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Redirect the user to the original long URL
    // 301 = Permanent redirect (browsers cache it — good for SEO, bad for analytics)
    // 302 = Temporary redirect (browsers re-request every time — better for click tracking)
    // We use 302 so every visit hits our server and we can count clicks accurately.
    // ─────────────────────────────────────────────────────────────────────────
    return res.redirect(urlDoc.originalUrl);

  } catch (error) {
    console.error("Redirect error:", error.message);
    res.status(500).json({ error: "Server error during redirect." });
  }
});

module.exports = router;
