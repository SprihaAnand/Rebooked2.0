const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/authMiddleware");
const {
  listNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, listNotificationsController);
router.patch("/read-all", authMiddleware, requireCsrf, markAllNotificationsReadController);
router.patch("/:notificationId/read", authMiddleware, requireCsrf, markNotificationReadController);

module.exports = router;
