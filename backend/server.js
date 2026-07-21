const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// ─── Database Connections ────────────────────────────────────────────────────
connectDB();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
// POST /api/shorten  →  create a short URL
// GET  /api/shorten  →  (extend later for listing, analytics, etc.)
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/url"));

// GET /:shortId  →  redirect to original URL  (must come AFTER /api routes)
app.use("/", require("./routes/redirect"));

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "LinkShift API is running." });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
