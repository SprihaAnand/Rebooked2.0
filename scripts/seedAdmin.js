const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const { normalizeEmail, isValidEmail } = require("../utils/validation");

dotenv.config();

async function seedAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD || "";
  if (!isValidEmail(email) || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before seeding");
  }

  await connectDB();
  const existing = await User.findOne({ email }).select("+password");
  if (existing) {
    existing.role = "admin";
    existing.status = "active";
    if (process.env.ADMIN_NAME) existing.name = process.env.ADMIN_NAME.trim();
    await existing.save();
    console.log(`Activated existing administrator ${email}`);
  } else {
    await User.create({
      role: "admin",
      name: (process.env.ADMIN_NAME || "Rebooked Administrator").trim(),
      email,
      password: await bcrypt.hash(password, 12),
      status: "active",
    });
    console.log(`Created administrator ${email}`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
