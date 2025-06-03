const mongoose = require("mongoose");

const monthlyCapSchema = new mongoose.Schema({
  userId: { // Added
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One cap per user
  },
  cap: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("MonthlyCap", monthlyCapSchema);
