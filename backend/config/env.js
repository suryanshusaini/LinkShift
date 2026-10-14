const required = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error("Missing required environment variables: " + missing.join(", "));

  if (String(process.env.JWT_SECRET).length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters. Generate a random secret and keep it outside source control.");
  }

  let frontend;
  try { frontend = new URL(process.env.FRONTEND_URL); } catch { throw new Error("FRONTEND_URL must be a valid absolute URL."); }
  if (process.env.NODE_ENV === "production" && frontend.protocol !== "https:") {
    throw new Error("FRONTEND_URL must use HTTPS in production.");
  }

  if (process.env.NODE_ENV === "production" && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured in production for verification and recovery email.");
  }

  if (!process.env.GOOGLE_CLIENT_ID) console.warn("GOOGLE_CLIENT_ID is not set. Google Sign-In will be unavailable.");
};

module.exports = validateEnv;
