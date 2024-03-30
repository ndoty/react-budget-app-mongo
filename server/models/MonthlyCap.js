const mongoose = require("mongoose");

const monthlyCapSchema = new mongoose.Schema({
  cap: {
    type: Number,
  },
});

module.exports = mongoose.model("MonthlyCap", monthlyCapSchema);