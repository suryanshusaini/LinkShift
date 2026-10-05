const mongoose = require("mongoose");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async ({ retries = 5, delayMs = 5000 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
      console.log("MongoDB connected:", conn.connection.host);
      return conn;
    } catch (error) {
      lastError = error;
      console.error("MongoDB connection attempt " + attempt + "/" + retries + " failed:", error.message);
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw lastError;
};

module.exports = connectDB;
