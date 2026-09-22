const mongoose = require("mongoose");
const Notification = require("../models/notificationModel");
const { positiveInteger } = require("../utils/validation");

function invalid(res, message, status = 400) {
  return res.status(status).send({ success: false, message });
}

async function listNotificationsController(req, res) {
  try {
    const page = positiveInteger(req.query.page, { min: 1, max: 100000 }) || 1;
    const limit = positiveInteger(req.query.limit, { min: 1, max: 50 }) || 20;
    const filters = { recipient: req.auth.user._id };
    if (req.query.unread === "true") filters.readAt = null;

    const [notifications, total, unread] = await Promise.all([
      Notification.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filters),
      Notification.countDocuments({ recipient: req.auth.user._id, readAt: null }),
    ]);
    return res.status(200).send({
      success: true,
      notifications,
      unread,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Notification list failed", error.message);
    return invalid(res, "Unable to load notifications", 500);
  }
}

async function markNotificationReadController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.notificationId)) {
      return invalid(res, "Invalid notification id");
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.auth.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) return invalid(res, "Notification not found", 404);
    return res.status(200).send({ success: true, notification });
  } catch (error) {
    console.error("Notification update failed", error.message);
    return invalid(res, "Unable to update notification", 500);
  }
}

async function markAllNotificationsReadController(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.auth.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.status(200).send({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Notifications mark-all failed", error.message);
    return invalid(res, "Unable to update notifications", 500);
  }
}

module.exports = {
  listNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
};
