const Notification = require("../models/notificationModel");

async function createNotification(payload) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    // Notifications are intentionally non-blocking: a successful claim must
    // not be rolled back because an optional in-app notification failed.
    console.error("Unable to create notification", error.message);
    return null;
  }
}

module.exports = { createNotification };
