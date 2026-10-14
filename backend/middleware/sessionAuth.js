const crypto = require("crypto");
const Session = require("../models/Session");

const SESSION_COOKIE = "linkshift_session";
const CSRF_COOKIE = "linkshift_csrf";
const isProduction = process.env.NODE_ENV === "production";
const sameSite = isProduction ? "None" : "Lax";

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite,
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});

const parseCookies = (header = "") => Object.fromEntries(
  header.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key),
);

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

const createSession = async (user, res) => {
  const raw = crypto.randomBytes(32).toString("base64url");
  const csrf = crypto.randomBytes(32).toString("base64url");
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  await Session.create({ userId: user._id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + maxAge) });
  res.cookie(SESSION_COOKIE, raw, cookieOptions(maxAge));
  res.cookie(CSRF_COOKIE, csrf, { httpOnly: false, secure: isProduction, sameSite, path: "/", maxAge });
  return csrf;
};

const clearSessionCookies = (res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.clearCookie(CSRF_COOKIE, { httpOnly: false, secure: isProduction, sameSite, path: "/" });
};

const csrfEndpoint = (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies[CSRF_COOKIE];
  const token = existing || crypto.randomBytes(32).toString("base64url");
  if (!existing) res.cookie(CSRF_COOKIE, token, { httpOnly: false, secure: isProduction, sameSite, path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.json({ csrfToken: token });
};

const sessionAuth = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE];
    if (!raw) return res.status(401).json({ message: "Please sign in to continue." });
    const session = await Session.findOne({ tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!session) {
      clearSessionCookies(res);
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    req.sessionId = session._id;
    req.userId = String(session.userId);
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrfCookie = cookies[CSRF_COOKIE];
      const csrfHeader = req.get("x-csrf-token");
      if (!csrfCookie || !csrfHeader || csrfCookie.length !== csrfHeader.length ||
          !crypto.timingSafeEqual(Buffer.from(csrfCookie), Buffer.from(csrfHeader))) {
        return res.status(403).json({ message: "Security token missing or invalid. Refresh and try again." });
      }
      const origin = req.get("origin");
      if (origin && origin !== process.env.FRONTEND_URL) return res.status(403).json({ message: "Origin is not allowed." });
    }
    session.lastSeenAt = new Date();
    await session.save();
    return next();
  } catch (error) {
    return next(error);
  }
};

const optionalSession = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE];
    req.userId = null;
    req.sessionId = null;
    if (raw) {
      const session = await Session.findOne({ tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() } });
      if (session) {
        req.userId = String(session.userId);
        req.sessionId = session._id;
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { SESSION_COOKIE, CSRF_COOKIE, cookieOptions, parseCookies, hash, createSession, clearSessionCookies, csrfEndpoint, sessionAuth, optionalSession };
