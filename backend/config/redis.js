const { createClient } = require("redis");

let client = null;
let connecting = null;

const getRedis = async () => {
  if (!process.env.REDIS_URL) return null;
  if (client?.isReady) return client;
  if (connecting) return connecting;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (error) => console.warn("Redis:", error.message));

  connecting = client.connect()
    .then(() => client)
    .catch((error) => {
      console.warn("Redis unavailable; continuing without cache:", error.message);
      try { client.disconnect(); } catch {}
      client = null;
      return null;
    })
    .finally(() => { connecting = null; });

  return connecting;
};

const get = async (key) => {
  const redis = await getRedis();
  if (!redis) return null;
  try { return await redis.get(key); } catch (error) { console.warn("Redis GET:", error.message); return null; }
};

const setJson = async (key, value, ttlSeconds) => {
  const redis = await getRedis();
  if (!redis || ttlSeconds <= 0) return;
  try { await redis.set(key, JSON.stringify(value), { EX: ttlSeconds }); }
  catch (error) { console.warn("Redis SET:", error.message); }
};

const del = async (key) => {
  const redis = await getRedis();
  if (!redis) return;
  try { await redis.del(key); } catch (error) { console.warn("Redis DEL:", error.message); }
};

const closeRedis = async () => {
  if (!client) return;
  try { await client.quit(); } catch { try { await client.disconnect(); } catch {} }
  client = null;
};

module.exports = { getRedis, get, setJson, del, closeRedis };
