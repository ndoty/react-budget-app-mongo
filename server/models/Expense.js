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
});

module.exports = mongoose.model("Expense", expenseSchema);