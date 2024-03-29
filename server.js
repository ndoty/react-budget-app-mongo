const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;


const mongoose = require("mongoose");
mongoose.connect("mongodb://"+user+":"+pass+"@technickservices.com/React-Budget-App?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Expense = require("./models/Expense" ); 
const Budget = require("./models/Budget" ); 

app.get("/api/expenses", async (req, res) => {
  try {
    const expense = await Expense.find();
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/budgets", async (req, res) => {
  try {
    const budget = await Budget.find();
    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const expense = new Expense(req.body);
    let result = await expense.save();
    result = result.toObject();
    if (result) {
      resp.send(req.body);
      console.log(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/api/budgets", async (req, res) => {
  try {
    const budget = new Budget(req.body);
    let result = await budget.save();
    result = result.toObject();
    if (result) {
      resp.send(req.body);
      console.log(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
