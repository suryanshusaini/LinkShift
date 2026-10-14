const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const validateEnv = require("./config/env");
const connectDB = require("./config/db");

validateEnv();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = new Set(String(process.env.FRONTEND_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean));
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://127.0.0.1:5173");
}
app.use(helmet({ referrerPolicy: { policy: "no-referrer" } }));
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
app.get("/health", (req, res) => res.json({ status: "ok", message: "LinkShift API is running." }));
app.use("/", require("./routes/redirect"));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.message === "Origin is not allowed by CORS.") return res.status(403).json({ error: "Origin is not allowed." });
  console.error("Unhandled request error:", err.message);
  return res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 8000;
connectDB().then(() => app.listen(PORT, () => console.log("LinkShift API listening on port " + PORT)));
