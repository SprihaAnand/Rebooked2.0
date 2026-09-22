const JWT = require("jsonwebtoken");
const User = require("../models/userModel");
const Session = require("../models/sessionModel");
const { SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } = require("../config/session");
const { isAllowedOrigin } = require("../config/cors");
const { getUserRole, canonicalizeRole } = require("../config/roles");
const { hashSessionToken, timingSafeEqual } = require("../utils/session");

function unauthorized(res, message = "Authentication is required") {
  return res.status(401).send({ success: false, message });
}

function attachAuth(req, user, details = {}) {
  req.auth = { user, ...details };
  req.userId = user._id;

  // Existing controllers used req.body.userId. Keep this temporary bridge so
  // legacy read-only endpoints do not accept an attacker-controlled user id.
  req.body = req.body || {};
  req.body.userId = user._id;
}

async function authenticateCookieSession(req) {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken) return null;

  const session = await Session.findOne({
    tokenHash: hashSessionToken(rawToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!session?.user) return null;
  await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } });
  return session;
}

async function authenticateLegacyBearer(req) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    return user ? { user, decoded } : null;
  } catch (_error) {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  try {
    const session = await authenticateCookieSession(req);
    if (session) {
      if ((session.user.status || "active") !== "active") {
        return unauthorized(res, "This account is not active");
      }
      attachAuth(req, session.user, { session, authType: "session" });
      return next();
    }

    // A short-lived compatibility path keeps pre-existing JWT clients working
    // during rollout. New login endpoints never issue these tokens.
    const legacy = await authenticateLegacyBearer(req);
    if (legacy) {
      if ((legacy.user.status || "active") !== "active") {
        return unauthorized(res, "This account is not active");
      }
      attachAuth(req, legacy.user, { authType: "legacy-bearer" });
      return next();
    }

    return unauthorized(res);
  } catch (error) {
    console.error("Authentication failed", error.message);
    return unauthorized(res);
  }
}

function requireRoles(...roles) {
  const expected = roles.map(canonicalizeRole).filter(Boolean);
  return (req, res, next) => {
    const role = getUserRole(req.auth?.user);
    if (!role || !expected.includes(role)) {
      return res.status(403).send({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    return next();
  };
}

function requireCsrf(req, res, next) {
  // Legacy bearer tokens are not ambient browser credentials and are therefore
  // not vulnerable to cookie-based CSRF. All new session-cookie writes must
  // carry a matching token or originate from the configured web application.
  if (req.auth?.authType === "legacy-bearer") return next();

  const headerToken = req.get("x-csrf-token");
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (timingSafeEqual(headerToken, cookieToken)) return next();

  const origin = req.get("origin");
  if (origin && isAllowedOrigin(origin)) return next();

  return res.status(403).send({
    success: false,
    message: "A valid CSRF token is required",
  });
}

module.exports = authMiddleware;
module.exports.requireRoles = requireRoles;
module.exports.requireCsrf = requireCsrf;
