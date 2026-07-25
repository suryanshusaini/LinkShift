const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// Trust Render's (and other reverse proxies') X-Forwarded-For header.
// Required for express-rate-limit to correctly identify client IPs in production.
app.set("trust proxy", 1);

// ─── Database Connection ─────────────────────────────────────────────────────
connectDB();

// ─── Middleware ──────────────────────────────────────────────────────────────
// CORS must come before routes so preflight OPTIONS requests are handled first.
app.use(cors());

// Parse incoming JSON bodies for POST/PUT/PATCH requests.
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
// ORDER MATTERS: specific prefixes must be registered before the wildcard redirect.

// Auth: POST /api/auth/login, POST /api/auth/register
app.use("/api/auth", require("./routes/auth"));

// URL management: POST /api/shorten, GET /api/urls, DELETE /api/:id
app.use("/api", require("./routes/url"));

// ─── Health Check ────────────────────────────────────────────────────────────
// Registered before the redirect wildcard so it is never swallowed by /:shortId.
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "LinkShift API is running." });
});

// ─── Redirect Route ──────────────────────────────────────────────────────────
// Must be LAST. The redirect router contains an internal guard that skips
// any path starting with /api or /health, so it will never shadow API routes
// even if Express reaches this handler due to a future route ordering change.
app.use("/", require("./routes/redirect"));

// ─── Start ───────────────────────────────────────────────────────────────────
// process.env.PORT is set automatically by Render in production.
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
