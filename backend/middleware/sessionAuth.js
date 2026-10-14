const crypto = require("crypto");
const Session = require("../models/Session");
const SESSION_COOKIE = "linkshift_session";
const CSRF_COOKIE = "linkshift_csrf";
const isProduction = process.env.NODE_ENV === "production";
const sameSite = isProduction ? "None" : "Lax";
const cookieOptions = (maxAge) => ({ httpOnly: true, secure: isProduction, sameSite, path: "/", ...(maxAge ? { maxAge } : {}) });
const parseCookies = (header = "") => Object.fromEntries(header.split(";").map((part) => {
  const index = part.indexOf("="); if (index < 0) return ["", ""];
  return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
}).filter(([key]) => key));
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const allowedOrigins = () => [...String(process.env.FRONTEND_URL || "").split(",").map((v) => v.trim()).filter(Boolean), ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://127.0.0.1:5173"] : [])];
const clearSessionCookies = (res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.clearCookie(CSRF_COOKIE, { httpOnly: false, secure: isProduction, sameSite, path: "/" });
};
const createSession = async (user, res) => {
  const raw = crypto.randomBytes(32).toString("base64url");
  const csrf = crypto.randomBytes(32).toString("base64url");
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  await Session.create({ userId: user._id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + maxAge) });
  res.cookie(SESSION_COOKIE, raw, cookieOptions(maxAge));
  res.cookie(CSRF_COOKIE, csrf, { httpOnly: false, secure: isProduction, sameSite, path: "/", maxAge });
  return csrf;
};
const csrfEndpoint = (req, res) => {
  const existing = parseCookies(req.headers.cookie)[CSRF_COOKIE];
  const token = existing || crypto.randomBytes(32).toString("base64url");
  if (!existing) res.cookie(CSRF_COOKIE, token, { httpOnly: false, secure: isProduction, sameSite, path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.json({ csrfToken: token });
};
const checkCsrf = (req, res, cookies) => {
  const cookie = cookies[CSRF_COOKIE], header = req.get("x-csrf-token");
  if (!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    res.status(403).json({ message: "Security token missing or invalid. Refresh and try again." }); return false;
  }
  const origin = req.get("origin");
  if (origin && !allowedOrigins().includes(origin)) { res.status(403).json({ message: "Origin is not allowed." }); return false; }
  return true;
};
const sessionAuth = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie), raw = cookies[SESSION_COOKIE];
    if (!raw) return res.status(401).json({ message: "Please sign in to continue." });
    const session = await Session.findOne({ tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!session) { clearSessionCookies(res); return res.status(401).json({ message: "Your session has expired. Please sign in again." }); }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !checkCsrf(req, res, cookies)) return;
    req.sessionId = session._id; req.userId = String(session.userId);
    session.lastSeenAt = new Date(); await session.save();
    return next();
  } catch (error) { return next(error); }
};
const optionalSession = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie), raw = cookies[SESSION_COOKIE];
    req.userId = null; req.sessionId = null;
    if (raw) {
      const session = await Session.findOne({ tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() } });
      if (session) {
        if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !checkCsrf(req, res, cookies)) return;
        req.userId = String(session.userId); req.sessionId = session._id;
      }
    }
    return next();
  } catch (error) { return next(error); }
};
module.exports = { SESSION_COOKIE, CSRF_COOKIE, parseCookies, hash, createSession, clearSessionCookies, csrfEndpoint, sessionAuth, optionalSession };
