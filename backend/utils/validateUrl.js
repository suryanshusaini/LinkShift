const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");

const MAX_URL_LENGTH = 2048;

const ipv4ToInt = (ip) => ip.split(".").reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0);
const inCidr = (ip, network, bits) => {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
};

const isBlockedIpv4 = (ip) => {
  if (!net.isIPv4(ip)) return true;
  const blocked = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
    ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
    ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
  ];
  return blocked.some(([network, bits]) => inCidr(ip, network, bits));
};

const isBlockedIp = (ip) => {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (!net.isIPv6(ip)) return true;
  const normalized = ip.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    if (net.isIPv4(mapped)) return isBlockedIpv4(mapped);
    const tail = mapped.match(/(?:^|:)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (tail) {
      const v4 = [parseInt(tail[1], 16) >> 8, parseInt(tail[1], 16) & 255, parseInt(tail[2], 16) >> 8, parseInt(tail[2], 16) & 255].join(".");
      return isBlockedIpv4(v4);
    }
  }
  // Reject unspecified, loopback, unique-local, link-local, multicast and documentation IPv6 ranges.
  return normalized === "::" || normalized === "::1" ||
    /^(fc|fd|fe[89ab])/i.test(normalized) ||
    /^ff/i.test(normalized) ||
    /^2001:db8:/i.test(normalized) ||
    /^2001:10:/i.test(normalized) ||
    /^2002:/i.test(normalized);
};

const validateUrl = async (value) => {
  if (typeof value !== "string" || !value.trim()) return { valid: false, message: "Enter a URL." };
  const input = value.trim();
  if (input.length > MAX_URL_LENGTH) return { valid: false, message: "URL must be 2048 characters or fewer." };

  let parsed;
  try { parsed = new URL(input); } catch { return { valid: false, message: "Enter a valid URL." }; }
  if (!["http:", "https:"].includes(parsed.protocol)) return { valid: false, message: "Only HTTP and HTTPS URLs are supported." };
  if (parsed.username || parsed.password) return { valid: false, message: "URLs containing embedded credentials are not supported." }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  let ownShortDomain = null;
  if (process.env.SHORT_BASE_URL) {
    try { ownShortDomain = new URL(process.env.SHORT_BASE_URL).hostname.toLowerCase().replace(/^\[|\]$/g, ""); } catch {}
  }

  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname === "0.0.0.0" || hostname === "::" || hostname === "::1") {
    return { valid: false, message: "Local URLs cannot be shortened." };
  }
  if (ownShortDomain && hostname === ownShortDomain) return { valid: false, message: "LinkShift short URLs cannot be shortened again." };
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) return { valid: false, message: "Private, reserved or local IP addresses cannot be shortened." };
  } else {
    try {
      const records = await dns.lookup(hostname, { all: true, verbatim: true });
      if (!records.length || records.some((record) => isBlockedIp(record.address))) {
        return { valid: false, message: "URLs resolving to private or reserved IP addresses cannot be shortened." };
      }
    } catch {
      return { valid: false, message: "The URL hostname could not be resolved." };
    }
  }
  return { valid: true, value: parsed.toString() };
};

module.exports = { validateUrl, MAX_URL_LENGTH, isBlockedIp };
