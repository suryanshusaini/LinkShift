const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const validateEnv = require("./config/env");
const connectDB = require("./config/db");
const { getRedis, closeRedis } = require("./config/redis");

validateEnv();
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = new Set([process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"]);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "32kb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/url"));

app.get("/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbReady = mongoose.connection.readyState === 1;
  const redis = await getRedis();
  const redisReady = Boolean(redis?.isReady);
  const ready = dbReady;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "degraded", db: dbReady, redis: redisReady });
});

app.use("/", require("./routes/redirect"));
app.use((err, req, res, next) => {
  console.error("Unhandled request error:", err.message);
  if (err.message === "Origin is not allowed by CORS.") return res.status(403).json({ error: "Origin is not allowed." });
  return res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  app.listen(PORT, () => console.log("🚀 LinkShift API listening on port " + PORT));
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