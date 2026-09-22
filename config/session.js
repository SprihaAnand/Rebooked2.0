const SESSION_COOKIE_NAME = "rebooked_session";
const CSRF_COOKIE_NAME = "rebooked_csrf";

function integerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sessionTtlMs() {
  return integerEnv("SESSION_TTL_DAYS", 30) * 24 * 60 * 60 * 1000;
}

function cookieSameSite() {
  const configured = String(process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  return ["lax", "strict", "none"].includes(configured) ? configured : "lax";
}

function secureCookies() {
  return process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

function baseCookieOptions() {
  const options = {
    secure: secureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function sessionCookieOptions() {
  return {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: sessionTtlMs(),
  };
}

function csrfCookieOptions() {
  return {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: sessionTtlMs(),
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = baseCookieOptions();
  return options;
}

module.exports = {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  sessionTtlMs,
  sessionCookieOptions,
  csrfCookieOptions,
  clearCookieOptions,
};
