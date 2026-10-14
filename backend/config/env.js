const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error("Missing required environment variables: " + missing.join(", "));
  if (String(process.env.JWT_SECRET).length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  const origins = String(process.env.FRONTEND_URL).split(",").map((v) => v.trim()).filter(Boolean);
  for (const value of origins) {
    let url;
    try { url = new URL(value); } catch { throw new Error("Every FRONTEND_URL entry must be an absolute URL."); }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("FRONTEND_URL entries must use HTTPS in production.");
  }
  if (process.env.NODE_ENV === "production" && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured in production.");
  }
};
module.exports = validateEnv;
