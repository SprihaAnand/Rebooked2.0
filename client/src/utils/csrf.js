const CSRF_COOKIE_NAME = "rebooked_csrf";
const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const prefix = `${CSRF_COOKIE_NAME}=`;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

// Browser cookies are HttpOnly except this double-submit CSRF value. Axios
// adds it only to unsafe requests; the API verifies it against the cookie.
export function attachCsrfHeader(config) {
  const method = String(config?.method || "get").toLowerCase();
  const token = UNSAFE_METHODS.has(method) ? getCsrfToken() : "";
  if (token) {
    config.headers = { ...(config.headers || {}), "X-CSRF-Token": token };
  }
  return config;
}
