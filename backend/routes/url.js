const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const Url = require("../models/Url");
const { optionalSession, sessionAuth } = require("../middleware/sessionAuth");
const { validateUrl } = require("../utils/validateUrl");
const { validateAlias } = require("../validators/alias");

const router = express.Router();
const guestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: "Guest limit reached. Please log in to create more links." }, skip: (req) => Boolean(req.userId) });
const accountLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: "Account limit reached. Please try again later." }, skip: (req) => !req.userId });

const createShortId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = crypto.randomBytes(5).toString("base64url").slice(0, 7);
    if (!(await Url.exists({ shortId: candidate }))) return candidate;
  }
  throw new Error("Unable to allocate a unique short ID.");
};

router.post("/shorten", optionalSession, guestLimiter, accountLimiter, async (req, res) => {
  try {
    const checkedUrl = await validateUrl(req.body.originalUrl);
    if (!checkedUrl.valid) return res.status(400).json({ error: checkedUrl.message });
    const checkedAlias = validateAlias(req.body.customAlias);
    if (!checkedAlias.valid) return res.status(400).json({ error: checkedAlias.message });
    if (checkedAlias.value && await Url.exists({ shortId: checkedAlias.value })) return res.status(409).json({ error: "This custom alias is already taken." });
    const shortId = checkedAlias.value || await createShortId();
    const newUrl = await Url.create({ originalUrl: checkedUrl.value, shortId, userId: req.userId || null });
    return res.status(201).json(newUrl);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "That short ID is already in use. Try again." });
    console.error("Shorten error:", error.message);
    return res.status(500).json({ error: "Server error while creating the short link." });
  }
});

router.get("/urls", sessionAuth, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(urls);
  } catch (error) {
    console.error("List URLs error:", error.message);
    return res.status(500).json({ error: "Server error." });
  }
});

router.delete("/:id", sessionAuth, async (req, res) => {
  try {
    const deletedUrl = await Url.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deletedUrl) return res.status(404).json({ error: "URL not found or unauthorized access." });
    return res.json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Delete URL error:", error.message);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
