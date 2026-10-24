const mongoose = require("mongoose");
const config = require("./env");
const logger = require("../utils/logger");

async function connectDb() {
  if (!config.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(config.MONGODB_URI);
  logger.info("MongoDB connected");
}

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDb, isDbConnected };
