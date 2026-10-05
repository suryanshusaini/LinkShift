const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const Url = require("../models/Url");
const ClickEvent = require("../models/ClickEvent");
const { validateUrl } = require("../utils/validateUrl");
const { validateAlias } = require("../validators/alias");
const { del: invalidateRedirect } = require("../config/redis");

const router = express.Router();
const generateShortId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7);

const optionalAuth = (req, res, next) => {
  req.userId = null;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.userId = decoded.userId || decoded.id || null;
    } catch {}
  }
  next();
};

const guestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Guest limit reached. Please log in to create more links." }, standardHeaders: true, legacyHeaders: false, skip: (req) => req.userId !== null });
const accountLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: "Account limit reached. Please try again later." }, standardHeaders: true, legacyHeaders: false, skip: (req) => req.userId === null });

const createShortId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateShortId();
    if (!(await Url.exists({ shortId: candidate }))) return candidate;
  }
  throw new Error("Unable to allocate a unique short ID.");
};

const requireAuth = (req, res, next) => optionalAuth(req, res, () => req.userId ? next() : res.status(401).json({ error: "Unauthorized" }));

router.post("/shorten", optionalAuth, guestLimiter, accountLimiter, async (req, res) => {
  try {
    const urlResult = await validateUrl(req.body.originalUrl);
    if (!urlResult.valid) return res.status(400).json({ error: urlResult.message });
    const aliasResult = validateAlias(req.body.customAlias);
    if (!aliasResult.valid) return res.status(400).json({ error: aliasResult.message });
    if (aliasResult.value && await Url.exists({ shortId: aliasResult.value })) return res.status(409).json({ error: "This custom alias is already taken." });

    let expiresAt = null;
    if (req.body.expiresAt) {
      const date = new Date(req.body.expiresAt);
      if (Number.isNaN(date.getTime()) || date <= new Date()) return res.status(400).json({ error: "Expiry date must be a valid future date." });
      if (!req.userId) return res.status(401).json({ error: "Sign in to set an expiry date." });
      expiresAt = date;
    }

    const newUrl = await Url.create({ originalUrl: urlResult.value, shortId: aliasResult.value || await createShortId(), userId: req.userId, expiresAt });
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
  const taken = await Url.exists({ shortId: result.value, deletedAt: null });
  return res.json({ available: !taken, alias: result.value });
});

router.get("/urls", requireAuth, async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const q = String(req.query.q || "").trim();
    const sort = String(req.query.sort || "newest");
    const status = String(req.query.status || "all");
    const filter = { userId: req.userId, deletedAt: null };
    if (q) filter.$or = [{ shortId: { $regex: q, $options: "i" } }, { originalUrl: { $regex: q, $options: "i" } }];
    if (status === "active") filter.isActive = true;
    if (status === "disabled") filter.isActive = false;
    if (status === "expiring") filter.expiresAt = { $ne: null, $lte: new Date(Date.now() + 7 * 86400000), $gt: new Date() };
    if (status === "expired") filter.expiresAt = { $ne: null, $lte: new Date() };

    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, clicks: { clicks: -1, createdAt: -1 }, updated: { updatedAt: -1 } };
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

router.get("/urls/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
  const url = await Url.findOne({ _id: req.params.id, userId: req.userId, deletedAt: null });
  if (!url) return res.status(404).json({ error: "URL not found." });
  return res.json(url);
});

router.get("/urls/:id/analytics", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
    const url = await Url.findOne({ _id: req.params.id, userId: req.userId, deletedAt: null }).select("_id clicks createdAt").lean();
    if (!url) return res.status(404).json({ error: "URL not found." });

    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 14, 1), 90);
    const since = new Date(Date.now() - days * 86400000);
    const match = { urlId: url._id, clickedAt: { $gte: since } };
    const [timeline, referrers, devices, browsers, operatingSystems] = await Promise.all([
      ClickEvent.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } }, clicks: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      ClickEvent.aggregate([{ $match: match }, { $group: { _id: "$referrer", clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }, { $limit: 8 }]),
      ClickEvent.aggregate([{ $match: match }, { $group: { _id: "$device", clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }]),
      ClickEvent.aggregate([{ $match: match }, { $group: { _id: "$browser", clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }]),
      ClickEvent.aggregate([{ $match: match }, { $group: { _id: "$os", clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }]),
    ]);
    return res.json({ totalClicks: url.clicks, rangeDays: days, timeline, referrers, devices, browsers, operatingSystems, createdAt: url.createdAt });
  } catch (error) {
    console.error("Analytics error:", error.message);
    return res.status(500).json({ error: "Could not load analytics." });
  }
});

router.patch("/urls/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
    const current = await Url.findOne({ _id: req.params.id, userId: req.userId, deletedAt: null });
    if (!current) return res.status(404).json({ error: "URL not found." });

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
    if (req.body.customAlias !== undefined) {
      const aliasResult = validateAlias(req.body.customAlias);
      if (!aliasResult.valid || !aliasResult.value) return res.status(400).json({ error: aliasResult.message || "A custom alias is required." });
      const conflict = await Url.exists({ shortId: aliasResult.value, _id: { $ne: req.params.id }, deletedAt: null });
      if (conflict) return res.status(409).json({ error: "That custom alias is already taken." });
      updates.shortId = aliasResult.value;
    }

    const updated = await Url.findOneAndUpdate({ _id: req.params.id, userId: req.userId, deletedAt: null }, { $set: updates }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "URL not found." });
    await invalidateRedirect(current.shortId);
    if (updated.shortId !== current.shortId) await invalidateRedirect(updated.shortId);
    return res.json(updated);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "That alias is already in use." });
    console.error("Update URL error:", error.message);
    return res.status(500).json({ error: "Server error." });
  }
});

router.delete("/urls/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid link ID." });
  const deleted = await Url.findOneAndUpdate({ _id: req.params.id, userId: req.userId, deletedAt: null }, { $set: { deletedAt: new Date(), isActive: false } }, { new: true });
  if (!deleted) return res.status(404).json({ error: "URL not found." });
  await invalidateRedirect(deleted.shortId);
  return res.json({ message: "URL moved to trash.", deleted });
});

router.post("/urls/:id/restore", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Deleted link not found." });
  const restored = await Url.findOneAndUpdate({ _id: req.params.id, userId: req.userId, deletedAt: { $ne: null } }, { $set: { deletedAt: null, isActive: true, retentionExpiresAt: new Date(Date.now() + 30 * 86400000) } }, { new: true });
  if (!restored) return res.status(404).json({ error: "Deleted link not found." });
  await invalidateRedirect(restored.shortId);
  return res.json(restored);
});

module.exports = router;