const mongoose = require("mongoose");

async function connectDB() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL is required before starting the server");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`Connected to MongoDB at ${mongoose.connection.host}`);
  return mongoose.connection;
}

module.exports = connectDB;
