require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// create application/json parser
var jsonParser = bodyParser.json()

const mongoose = require("mongoose");
mongoose.connect("mongodb://"+user+":"+pass+"@technickservices.com/React-Budget-App?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Budget = require("./models/Budget" ); 
const Expense = require("./models/Expense" ); 
const MonthlyCap = require('./models/MonthlyCap');

app.get("/api/budgets", async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.status(200).json(budgets)
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses)
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/monthlyCap", async (req, res) => {
  try {
    const cap = await MonthlyCap.find();
    res.status(200).json(cap)
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/api/budgets", jsonParser, async (req, res) => {
  try {
    if (req.body.data !== undefined) {
      const budgets = JSON.parse(req.body.data)
      await Budget.deleteMany()
      await Budget.insertMany(budgets)
      res.status(200).send(budgets)
    }
  } catch (error) {
    console.error("Server POST ERORR budgets: ", error);
    res.status(500).send("Server Error");
  }
});

app.post("/api/expenses", jsonParser, async (req, res) => {
  try {
    if (req.body.data !== undefined) {
      const expenses = JSON.parse(req.body.data)
      await Expense.deleteMany()
      await Expense.insertMany(expenses)
      res.status(200).send(expenses)
    }
  } catch (error) {
    console.error("Server POST ERORR expenses: ", error);
    res.status(500).send("Server Error");
  }
});
  
app.post("/api/monthlyCap", jsonParser, async (req, res) => {
    try {
      if (req.body.data !== undefined) {
        const cap = JSON.parse(req.body.data)
        await MonthlyCap.deleteMany()
        await MonthlyCap.insertMany(cap)
        res.status(200).send(cap)
      }
    } catch (error) {
      console.error("Server POST ERORR expenses: ", error);
      res.status(500).send("Server Error");
    }
});