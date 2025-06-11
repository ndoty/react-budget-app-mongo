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
  isBill: { 
    type: Boolean,
    required: true,
    default: false,
  },
  // MODIFIED: Reverted dueDate type back to Number
  dueDate: {
    type: Number,
    min: 1,
    max: 31,
    required: false,
  },
});

module.exports = mongoose.model("Expense", expenseSchema);
