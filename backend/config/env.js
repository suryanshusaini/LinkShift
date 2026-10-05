const required = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn("⚠️ GOOGLE_CLIENT_ID is not set. Google Sign-In will be unavailable.");
  }

  if (missing.length) {
    throw new Error("Missing required environment variables: " + missing.join(", "));
  }
};

module.exports = validateEnv;
