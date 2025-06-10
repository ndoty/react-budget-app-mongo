const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: { // Added
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
  budgetId: { // Refers to client-side Budget.id
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Expense", expenseSchema);
