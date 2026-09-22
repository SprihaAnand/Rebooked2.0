const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  registerController,
  loginController,
  googleLoginController,
  currentUserController,
  updateProfileController,
  logoutController,
  logoutAllController,
  getSessionsController,
  revokeSessionController,
  changePasswordController,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/authMiddleware");

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Try again shortly." },
});

router.post("/register", authRateLimiter, registerController);
router.post("/login", authRateLimiter, loginController);
router.post("/google", authRateLimiter, googleLoginController);

router.get("/me", authMiddleware, currentUserController);
// Legacy path retained for the current React application during rollout.
router.get("/current-user", authMiddleware, currentUserController);
router.patch("/profile", authMiddleware, requireCsrf, updateProfileController);

router.post("/logout", authMiddleware, requireCsrf, logoutController);
router.post("/logout-all", authMiddleware, requireCsrf, logoutAllController);
router.get("/sessions", authMiddleware, getSessionsController);
router.delete("/sessions/:sessionId", authMiddleware, requireCsrf, revokeSessionController);
router.post("/change-password", authMiddleware, requireCsrf, changePasswordController);

module.exports = router;
