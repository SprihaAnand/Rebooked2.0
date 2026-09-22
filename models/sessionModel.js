const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    // Only a SHA-256 digest is stored. A database leak therefore cannot be
    // replayed as a browser session.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    authMethod: {
      type: String,
      enum: ["password", "google"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    revokedAt: Date,
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

module.exports = mongoose.model("Session", sessionSchema);
