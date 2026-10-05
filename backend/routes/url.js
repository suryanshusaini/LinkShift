const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { customAlphabet } = require("nanoid");
const Url = require("../models/Url");
const { validateUrl } = require("../utils/validateUrl");
const { validateAlias } = require("../validators/alias");

const router = express.Router();
const generateShortId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7);

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  req.userId = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      req.userId = decoded.userId || decoded.id || null;
    } catch {}
  }
  next();
};

const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Guest limit reached. Please log in to create more links." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.userId !== null,
});

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Account limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.userId === null,
});

const createShortId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateShortId();
    const exists = await Url.exists({ shortId: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Unable to allocate a unique short ID.");
};

router.post("/shorten", optionalAuth, guestLimiter, accountLimiter, async (req, res) => {
  try {
    const urlResult = await validateUrl(req.body.originalUrl);
    if (!urlResult.valid) return res.status(400).json({ error: urlResult.message });

    const aliasResult = validateAlias(req.body.customAlias);
    if (!aliasResult.valid) return res.status(400).json({ error: aliasResult.message });

    const shortId = aliasResult.value || await createShortId();
    if (aliasResult.value && await Url.exists({ shortId: aliasResult.value })) {
      return res.status(409).json({ error: "This custom alias is already taken." });
    }

    let expiresAt = null;
    if (req.body.expiresAt) {
      const parsedExpiry = new Date(req.body.expiresAt);
      if (Number.isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return res.status(400).json({ error: "Expiry date must be a valid future date." });
      }
      if (!req.userId) return res.status(401).json({ error: "Sign in to set an expiry date." });
      expiresAt = parsedExpiry;
    }

    const newUrl = await Url.create({ originalUrl: urlResult.value, shortId, userId: req.userId, expiresAt });
    return res.status(201).json(newUrl);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "That short ID is already in use. Try again." });
    console.error("Shorten error:", error.message);
    return res.status(500).json({ error: "Server error while creating the short link." });
  }
});

router.get("/alias/check", optionalAuth, async (req, res) => {
  const result = validateAlias(req.query.alias);
  if (!result.valid) return res.status(400).json({ available: false, error: result.message });
  if (!result.value) return res.json({ available: false, error: "Enter an alias." });
  const taken = await Url.exists({ shortId: result.value });
  return res.json({ available: !taken, alias: result.value });
});

router.get("/urls", optionalAuth, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const q = String(req.query.q || "").trim();
    const sort = String(req.query.sort || "newest");
    const status = String(req.query.status || "all");
    const filter = { userId: req.userId };
    if (q) filter.$or = [{ shortId: { $regex: q, $options: "i" } }, { originalUrl: { $regex: q, $options: "i" } }];
    if (status === "active") filter.isActive = true;
    if (status === "disabled") filter.isActive = false;
    if (status === "expiring") filter.expiresAt = { $ne: null, $lte: new Date(Date.now() + 7 * 86400000), $gt: new Date() };

    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, clicks: { clicks: -1, createdAt: -1 } };
    const [items, total] = await Promise.all([
      Url.find(filter).sort(sortMap[sort] || sortMap.newest).skip((page - 1) * limit).limit(limit).lean(),
      Url.countDocuments(filter),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("List URLs error:", error.message);
    return res.status(500).json({ error: "Server error." });
  }
});

const requireAuth = (req, res, next) => {
  optionalAuth(req, res, () => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    next();
  });
};

router.get("/urls/:id", requireAuth, async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
    const url = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!url) return res.status(404).json({ error: "URL not found." });
    return res.json(url);
  } catch (error) { return res.status(500).json({ error: "Server error." }); }
});

router.patch("/urls/:id", requireAuth, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
    const updates = {};
    if (req.body.originalUrl !== undefined) {
      const result = await validateUrl(req.body.originalUrl);
      if (!result.valid) return res.status(400).json({ error: result.message });
      updates.originalUrl = result.value;
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (req.body.expiresAt !== undefined) {
      if (req.body.expiresAt === null || req.body.expiresAt === "") updates.expiresAt = null;
      else {
        const date = new Date(req.body.expiresAt);
        if (Number.isNaN(date.getTime()) || date <= new Date()) return res.status(400).json({ error: "Expiry date must be in the future." });
        updates.expiresAt = date;
      }
    }
    const updated = await Url.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { $set: updates }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "URL not found." });
    return res.json(updated);
  } catch (error) { return res.status(500).json({ error: "Server error." }); }
});

router.delete("/urls/:id", requireAuth, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
    const deleted = await Url.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: "URL not found." });
    return res.json({ message: "URL deleted successfully.", deleted });
  } catch (error) { return res.status(500).json({ error: "Server error." }); }
});

// Backward-compatible endpoint; frontend v2 uses DELETE /api/urls/:id.
router.delete("/:id", requireAuth, async (req, res) => {
  if (!require("mongoose").isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
  const deleted = await Url.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ error: "URL not found." });
  return res.json({ message: "URL deleted successfully." });
});

module.exports = router;
