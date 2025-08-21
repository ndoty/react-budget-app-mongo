// admin-reset-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if your User model is elsewhere

// --- CONFIGURATION ---
// The script reads the MongoDB connection string from your environment variables
const MONGO_URI = process.env.MONGO_URI;

// --- SCRIPT LOGIC ---
const resetPassword = async (username, newPassword) => {
  if (!MONGO_URI) {
    console.error("🔴 ERROR: MONGO_URI environment variable is not set.");
    process.exit(1);
  }

  if (!username || !newPassword) {
    console.error("🔴 ERROR: Please provide a username and a new password.");
    console.log("   Usage: node admin-reset-password.js <username> <new_password>");
    process.exit(1);
  }

  try {
    console.log("Connecting to the database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database connected.");

    console.log(`Searching for user: ${username}...`);
    const user = await User.findOne({ username });

    if (!user) {
      console.error(`🔴 ERROR: User '${username}' not found.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ User '${username}' found. Hashing new password...`);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear any pending email-based reset tokens just in case
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    console.log(`✅ Success! Password for '${username}' has been reset.`);

  } catch (error) {
    console.error("🔥 An unexpected error occurred:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

// Get arguments from command line
const username = process.argv[2];
const newPassword = process.argv[3];

resetPassword(username, newPassword);