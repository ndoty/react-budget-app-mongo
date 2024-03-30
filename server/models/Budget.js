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
});

module.exports = mongoose.model("Budget", budgetSchema);