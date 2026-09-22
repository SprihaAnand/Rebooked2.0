function normalizeOrigin(origin) {
  if (typeof origin !== "string") return "";
  const trimmed = origin.trim();
  if (!trimmed) return "";

  try {
    // `URL#origin` removes a trailing slash. CRA's Windows proxy sends its
    // target as `http://localhost:8080/`, while browsers normally omit it.
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

function allowedOrigins() {
  const configured = String(
    process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000"
  )
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  const isLoopbackOrigin = (origin) => {
    try {
      const hostname = new URL(origin).hostname;
      return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    } catch {
      return false;
    }
  };

  // Create React App's development proxy can forward a browser request with
  // the target API origin (`http://localhost:8080`) in its Origin header.
  // Respect an explicitly local CLIENT_URL even if a parent shell happens to
  // export NODE_ENV=production. Production deployments with a hosted client
  // origin never receive this loopback exception.
  if (process.env.NODE_ENV !== "production" || configured.some(isLoopbackOrigin)) {
    configured.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
      "http://127.0.0.1:8080"
    );
  }

  return [...new Set(configured)];
}

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins().includes(normalizeOrigin(origin));
}

function corsOptions() {
  return {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  };
}

module.exports = { allowedOrigins, isAllowedOrigin, corsOptions, normalizeOrigin };
