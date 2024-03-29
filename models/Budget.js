const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  max: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Budget", budgetSchema);