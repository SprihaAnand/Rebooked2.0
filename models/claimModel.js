const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    status: {
      type: String,
      enum: ["accepted", "pickup_scheduled", "collected", "cancelled"],
      default: "accepted",
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    scheduledFor: Date,
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    collectedAt: Date,
    cancelledAt: Date,
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true, optimisticConcurrency: true }
);

// A recipient can make one claim per donation. This prevents duplicate clicks
// from creating multiple reservations and makes capacity accounting reliable.
claimSchema.index({ donation: 1, recipient: 1 }, { unique: true });
claimSchema.index({ recipient: 1, status: 1, createdAt: -1 });
claimSchema.index({ donation: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);
