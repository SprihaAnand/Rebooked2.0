const mongoose = require("mongoose");
const { ROLE_ALIASES } = require("../config/roles");

const userSchema = new mongoose.Schema(
  {
    // New accounts store canonical values. Legacy values remain allowed so
    // existing records can continue to sign in while they are migrated.
    role: {
      type: String,
      required: [true, "role is required"],
      enum: Object.keys(ROLE_ALIASES),
      default: "donor",
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    organizationName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    schoolName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    // Compatibility fields from the first version of Rebooked.
    organisationName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    instituteName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    emailVerifiedAt: Date,
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      index: true,
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1, createdAt: -1 });

userSchema.set("toJSON", {
  transform: (_document, returned) => {
    delete returned.password;
    delete returned.googleId;
    return returned;
  },
});

module.exports = mongoose.model("users", userSchema);
