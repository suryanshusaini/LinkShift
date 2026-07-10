const { createClient } = require("redis");

// Create a Redis client pointing to your local Docker instance.
// REDIS_URL defaults to redis://127.0.0.1:6379 — the standard local port.
const client = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

// Log any connection errors without crashing the server.
// This is important: if Redis is down, your app should degrade gracefully
// and still serve requests (just slower, from MongoDB).
client.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

// Connect when this module is first imported.
// We export both the client and a helper to connect.
const connectRedis = async () => {
  try {
    await client.connect();
    console.log("✅ Redis connected successfully.");
  } catch (err) {
    console.error("❌ Redis connection failed:", err.message);
    // Don't crash — the app will still work via MongoDB only.
  }
};

module.exports = { client, connectRedis };
