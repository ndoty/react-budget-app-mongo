const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  userId: { // Added
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  id: { // Client-side UUID
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
});
// Optional: if budget names must be unique per user
// budgetSchema.index({ userId: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Budget", budgetSchema);
