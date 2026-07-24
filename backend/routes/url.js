const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const Url = require("../models/Url");

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId || decoded.id;
    } catch (error) {
      console.error("Invalid token");
    }
  }
  next();
};

const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Too many URLs created from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/shorten", optionalAuth, shortenLimiter, async (req, res) => {
  try {
    const { originalUrl, customAlias } = req.body;
    let shortId;

    if (customAlias && customAlias.trim() !== "") {
      const existingUrl = await Url.findOne({ shortId: customAlias });
      if (existingUrl) {
        return res
          .status(400)
          .json({ error: "This custom alias is already taken." });
      }
      shortId = customAlias;
    } else {
      shortId = crypto.randomBytes(3).toString("hex");
    }

    const newUrl = new Url({
      originalUrl,
      shortId,
      userId: req.userId || null,
    });

    await newUrl.save();
    res.json(newUrl);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", optionalAuth, async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const deletedUrl = await Url.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedUrl) {
      return res
        .status(404)
        .json({ error: "URL not found or unauthorized access." });
    }

    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
