const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "claim_accepted",
        "claim_scheduled",
        "claim_collected",
        "claim_cancelled",
        "account_status",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    resourceType: {
      type: String,
      enum: ["claim", "donation", "user"],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
