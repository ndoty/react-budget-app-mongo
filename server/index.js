require('dotenv').config();
const express = require('express');
// const bodyParser = require('body-parser'); // express.json() is preferred
const cors = require('cors');
const app = express();
app.use(cors()); // Configure CORS appropriately for production
const PORT = process.env.PORT || 5000;
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;

const authMiddleware = require('./middleware/authMiddleware');

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middlewares
app.use(express.json()); // Replaces bodyParser.json()

const mongoose = require("mongoose");
const mongoURI = `mongodb://${user}:${pass}@technickservices.com/React-Budget-App?authSource=admin`; // Construct your URI
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

// Auth Routes (Public)
app.use('/api/auth', require('./routes/auth'));

// --- Protected API Routes ---

// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error(error); res.status(500).send("Server Error"); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { name, max, id: clientId } = req.body; // Expecting client-generated id
    if (!name || max === undefined || !clientId) {
        return res.status(400).send("Missing required budget fields (name, max, id).");
    }
    const newBudget = new Budget({ name, max, id: clientId, userId: req.userId });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) { console.error("Budget POST Error:", error); res.status(500).send("Server Error"); }
});

app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!budget) {
            return res.status(404).json({ msg: "Budget not found or user not authorized" });
        }
        await Expense.updateMany(
            { userId: req.userId, budgetId: req.params.clientId },
            { $set: { budgetId: "Uncategorized" } } // Ensure client uses this "Uncategorized" string
        );
        res.json({ msg: "Budget removed" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});


// Expenses
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.status(200).json(expenses);
  } catch (error) { console.error(error); res.status(500).send("Server Error"); }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const { description, amount, budgetId, id: clientId } = req.body;
     if (!description || amount === undefined || !budgetId || !clientId) {
        return res.status(400).send("Missing required expense fields (description, amount, budgetId, id).");
    }
    const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) { console.error("Expense POST Error:", error); res.status(500).send("Server Error"); }
});

app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!expense) {
            return res.status(404).json({ msg: "Expense not found or user not authorized" });
        }
        res.json({ msg: "Expense removed" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// Monthly Cap
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const capDoc = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(capDoc ? [capDoc] : []); // Client expects an array
  } catch (error) { console.error(error); res.status(500).send("Server Error"); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const { cap } = req.body; // Expecting { cap: number } or {}/null to remove
    await MonthlyCap.deleteOne({ userId: req.userId });

    if (cap !== undefined && cap !== null && !isNaN(parseFloat(cap)) && parseFloat(cap) > 0) {
      const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) });
      await newCap.save();
      res.status(200).json([newCap]); // Return as array
    } else {
      res.status(200).json([]); // Indicate cap removed or set to zero
    }
  } catch (error) { console.error("MonthlyCap POST Error:", error); res.status(500).send("Server Error"); }
});
