const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  id: { // Client-side UUID
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  budgetId: { 
    type: String,
    required: true,
  },
  isBill: { // Ensure this field is present
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("Expense", expenseSchema);
