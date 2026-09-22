const crypto = require("crypto");
const Session = require("../models/sessionModel");
const {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  sessionTtlMs,
  sessionCookieOptions,
  csrfCookieOptions,
  clearCookieOptions,
} = require("../config/session");

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createRandomToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function requestMetadata(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.ip || "").split(",")[0].trim();

  return {
    ipAddress: ipAddress.slice(0, 100),
    userAgent: String(req.get("user-agent") || "").slice(0, 500),
  };
}

async function createSession(user, req, authMethod) {
  const rawToken = createRandomToken();
  const csrfToken = createRandomToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs());

  const session = await Session.create({
    user: user._id,
    tokenHash: hashSessionToken(rawToken),
    authMethod,
    expiresAt,
    ...requestMetadata(req),
  });

  return { rawToken, csrfToken, session };
}

function setSessionCookies(res, { rawToken, csrfToken }) {
  res.cookie(SESSION_COOKIE_NAME, rawToken, sessionCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
}

function clearSessionCookies(res) {
  res.clearCookie(SESSION_COOKIE_NAME, clearCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, clearCookieOptions());
}

function timingSafeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = {
  hashSessionToken,
  createSession,
  setSessionCookies,
  clearSessionCookies,
  timingSafeEqual,
};
