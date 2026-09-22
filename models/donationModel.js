const mongoose = require("mongoose");

const BOOK_CATEGORIES = [
  "Elementary",
  "JEE",
  "NEET",
  "Novels",
  "Architecture",
  "History",
  "Kids",
  "Autobiographies",
  "Academic",
  "Other",
];

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    author: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    category: {
      type: String,
      enum: BOOK_CATEGORIES,
      default: "Other",
      index: true,
    },
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "well_loved"],
      default: "good",
    },
    language: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "English",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    quantityTotal: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },
    status: {
      type: String,
      enum: ["available", "partially_claimed", "claimed", "withdrawn"],
      default: "available",
      index: true,
    },
    pickup: {
      address: { type: String, trim: true, maxlength: 300 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      postalCode: { type: String, trim: true, maxlength: 20 },
      instructions: { type: String, trim: true, maxlength: 1000 },
    },
    imageUrls: [{ type: String, trim: true, maxlength: 2048 }],
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, optimisticConcurrency: true }
);

donationSchema.index({ status: 1, category: 1, createdAt: -1 });
donationSchema.index({ donor: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Donation", donationSchema);
module.exports.BOOK_CATEGORIES = BOOK_CATEGORIES;
