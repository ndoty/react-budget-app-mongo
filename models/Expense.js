const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
  },
  budgetId: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Expense", expenseSchema);