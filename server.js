const fs = require("fs");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { corsOptions } = require("./config/cors");

dotenv.config();

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // Listings may use an optional HTTPS cover image and Google Identity
      // Services is loaded only when the deployment configured a client ID.
      // Keep the CSP restrictive while allowing those two intended origins.
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "data:", "https:"],
          "script-src": ["'self'", "https://accounts.google.com"],
          "frame-src": ["'self'", "https://accounts.google.com"],
          // Relative `/api/v1` is the production default.  HTTPS also keeps
          // an explicitly configured hosted API usable when the client is
          // deployed separately; local CRA development uses its own proxy.
          "connect-src": ["'self'", "https:", "http://localhost:*"],
        },
      },
      // The React bundle can load public donation images from approved HTTPS
      // hosts, so do not block them with Helmet's cross-origin resource policy.
      crossOriginResourcePolicy: false,
    })
  );
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Try again shortly." },
  });
  app.use("/api", apiLimiter);

  app.get("/api/v1/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    return res.status(connected ? 200 : 503).send({
      success: connected,
      status: connected ? "ok" : "degraded",
      database: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", require("./routes/authRoutes"));
  app.use("/api/v1/donations", require("./routes/donationRoutes"));
  app.use("/api/v1/notifications", require("./routes/notificationRoutes"));
  app.use("/api/v1/dashboard", require("./routes/dashboardRoutes"));
  app.use("/api/v1/admin", require("./routes/adminRoutes"));
  app.use("/api/v1/test", require("./routes/testRoutes"));

  const clientBuild = path.join(__dirname, "client", "build");
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      return res.sendFile(path.join(clientBuild, "index.html"));
    });
  }

  app.use((req, res) => {
    res.status(404).send({ success: false, message: "Route not found" });
  });

  app.use((error, _req, res, _next) => {
    if (error?.message === "Origin is not allowed by CORS") {
      return res.status(403).send({ success: false, message: error.message });
    }
    console.error("Unhandled request error", error.message);
    return res.status(500).send({ success: false, message: "Unexpected server error" });
  });

  return app;
}

const app = createApp();

async function startServer() {
  await connectDB();
  const port = Number.parseInt(process.env.PORT, 10) || 8080;
  return app.listen(port, "0.0.0.0", () => {
    console.log(`Rebooked API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Unable to start Rebooked API: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
