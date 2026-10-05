const express = require("express");
const Url = require("../models/Url");
const ClickEvent = require("../models/ClickEvent");
const { get, setJson } = require("../config/redis");
const { cleanReferrer, parseUserAgent } = require("../utils/analytics");

const router = express.Router();
const CACHE_TTL_SECONDS = 300;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const RESERVED_PREFIXES = ["/api", "/health", "/favicon.ico"];
const cacheKey = (shortId) => "linkshift:redirect:" + shortId;

const cacheable = (url) => ({
  id: String(url._id),
  originalUrl: url.originalUrl,
  isActive: url.isActive,
  expiresAt: url.expiresAt,
  deletedAt: url.deletedAt,
});

const recordClick = (urlId, req) => {
  const { browser, os, device } = parseUserAgent(req.get("user-agent") || "");
  return ClickEvent.create({
    urlId,
    referrer: cleanReferrer(req.get("referer") || req.get("referrer")),
    browser,
    os,
    device,
  }).catch((error) => console.warn("Click analytics event failed:", error.message));
};

router.get("/:shortId", async (req, res) => {
  if (RESERVED_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix))) return res.status(404).json({ error: "Route not found." });

  try {
    const now = Date.now();
    const key = cacheKey(req.params.shortId);
    let target = null;
    const raw = await get(key);
    if (raw) { try { target = JSON.parse(raw); } catch {} }

    if (!target) {
      const url = await Url.findOne({ shortId: req.params.shortId }).select("_id originalUrl isActive expiresAt deletedAt").lean();
      if (!url) return res.status(404).json({ error: "Short URL not found or expired." });
      const ttl = url.expiresAt ? Math.min(CACHE_TTL_SECONDS, Math.max(1, Math.floor((new Date(url.expiresAt).getTime() - now) / 1000))) : CACHE_TTL_SECONDS;
      if (ttl > 0) await setJson(key, cacheable(url), ttl);
      target = cacheable(url);
    }

    if (!target.isActive || target.deletedAt || (target.expiresAt && new Date(target.expiresAt).getTime() <= now)) return res.status(404).json({ error: "Short URL not found or expired." });

    const accessedAt = new Date();
    const updated = await Url.findOneAndUpdate(
      { _id: target.id, shortId: req.params.shortId, isActive: true, deletedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: accessedAt } }] },
      { $inc: { clicks: 1 }, $set: { lastAccessedAt: accessedAt, retentionExpiresAt: new Date(now + RETENTION_MS) } },
      { new: true, projection: { clicks: 1 } },
    );
    if (!updated) return res.status(404).json({ error: "Short URL not found or expired." });

    void recordClick(target.id, req);
    return res.redirect(302, target.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error.message);
    return res.status(500).json({ error: "Server error during redirect." });
  }
});

module.exports = router;