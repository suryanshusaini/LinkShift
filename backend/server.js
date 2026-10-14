const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const validateEnv = require("./config/env");
const connectDB = require("./config/db");
const { getRedis, closeRedis } = require("./config/redis");

validateEnv();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = new Set(String(process.env.FRONTEND_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean));
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://127.0.0.1:5173");
}
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, referrerPolicy: { policy: "no-referrer" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  maxAge: 600,
}));
app.use(express.json({ limit: "32kb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/url"));

app.get("/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbReady = mongoose.connection.readyState === 1;
  let redisReady = false;
  try { const redis = await getRedis(); redisReady = Boolean(redis?.isReady); } catch {}
  const ready = dbReady;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "degraded", db: dbReady, redis: redisReady });
});

app.use("/", require("./routes/redirect"));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.message === "Origin is not allowed by CORS.") return res.status(403).json({ error: "Origin is not allowed." });
  console.error("Unhandled request error:", err.message);
  return res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  app.listen(PORT, () => console.log("LinkShift API listening on port " + PORT));
}).catch((error) => {
  console.error("Unable to start LinkShift:", error.message);
  process.exit(1);
});

const shutdown = async (signal) => {
  console.log(signal + " received. Shutting down gracefully.");
  await closeRedis();
  await require("mongoose").connection.close(false);
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
