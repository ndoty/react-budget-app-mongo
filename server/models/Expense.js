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
  budgetId: { // This will now hold a budget's ID, "Uncategorized", or "Bills"
    type: String,
    required: true,
  },
  // The 'isBill' field has been removed.
});

module.exports = mongoose.model("Expense", expenseSchema);
