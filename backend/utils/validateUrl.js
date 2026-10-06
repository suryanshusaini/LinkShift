const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");

const MAX_URL_LENGTH = 2048;

const isPrivateIpv4 = (ip) => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127 || (a === 169 && b === 254);
};

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }
  return false;
};

const validateUrl = async (value) => {
  if (typeof value !== "string" || !value.trim()) return { valid: false, message: "Enter a URL." };
  const input = value.trim();
  if (input.length > MAX_URL_LENGTH) return { valid: false, message: "URL must be 2048 characters or fewer." };

  let parsed;
  try { parsed = new URL(input); } catch { return { valid: false, message: "Enter a valid URL." }; }
  if (!["http:", "https:"].includes(parsed.protocol)) return { valid: false, message: "Only HTTP and HTTPS URLs are supported." };

  const hostname = parsed.hostname.toLowerCase();
  let ownShortDomain = null;
  if (process.env.SHORT_BASE_URL) {
    try { ownShortDomain = new URL(process.env.SHORT_BASE_URL).hostname.toLowerCase(); } catch {}
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "0.0.0.0" || hostname === "[::1]" || hostname === "::1") {
    return { valid: false, message: "Local URLs cannot be shortened." };
  }
  if (ownShortDomain && hostname === ownShortDomain) return { valid: false, message: "LinkShift short URLs cannot be shortened again." };
  if (net.isIP(hostname) && isPrivateIp(hostname)) return { valid: false, message: "Private or local IP addresses cannot be shortened." };

  if (!net.isIP(hostname)) {
    try {
      const records = await dns.lookup(hostname, { all: true });
      if (records.some((record) => isPrivateIp(record.address))) return { valid: false, message: "URLs resolving to private IP addresses cannot be shortened." };
    } catch {
      return { valid: false, message: "The URL hostname could not be resolved." };
    }
  }
  return { valid: true, value: parsed.toString() };
};

module.exports = { validateUrl, MAX_URL_LENGTH };
