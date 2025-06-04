require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const authMiddleware = require('./middleware/authMiddleware'); // Your auth middleware
const authRoutes = require('./routes/auth'); // Your auth routes

// Models (ensure these paths are correct)
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes - configure more strictly for production
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const mongoURI = process.env.MONGO_URI || `mongodb://${user}:${pass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Mongoose 6 always behaves as if autoIndex is true for dev, and false for prod.
  // You can explicitly set autoIndex: true/false if needed.
})
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => console.error('MongoDB Connection Error:', err.message, err));


// --- Public Routes ---
app.use('/api/auth', authRoutes); // Mount authentication routes

// --- Protected API Routes (all routes below this will require a token) ---

// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error("GET Budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { name, max, id: clientId } = req.body;
    if (!name || max === undefined || !clientId) {
        return res.status(400).json({ msg: "Missing required budget fields (name, max, id)."});
    }
    const newBudget = new Budget({ name, max, id: clientId, userId: req.userId });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST Budget Error:", error); res.status(500).json({ msg: "Server Error Creating Budget" }); }
});

app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!budget) {
            return res.status(404).json({ msg: "Budget not found or user not authorized" });
        }
        await Expense.updateMany(
            { userId: req.userId, budgetId: req.params.clientId },
            { $set: { budgetId: "Uncategorized" } }
        );
        res.json({ msg: "Budget removed and expenses reassigned" });
    } catch (error) {
        console.error("DELETE Budget Error:", error.message);
        res.status(500).json({ msg: "Server Error Deleting Budget" });
    }
});

// Expenses (similar structure to Budgets)
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.status(200).json(expenses);
  } catch (error) { console.error("GET Expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const { description, amount, budgetId, id: clientId } = req.body;
     if (!description || amount === undefined || !budgetId || !clientId) {
        return res.status(400).json({ msg: "Missing required expense fields."});
    }
    const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST Expense Error:", error); res.status(500).json({ msg: "Server Error Creating Expense" }); }
});

app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!expense) {
            return res.status(404).json({ msg: "Expense not found or user not authorized" });
        }
        res.json({ msg: "Expense removed" });
    } catch (error) {
        console.error("DELETE Expense Error:", error.message);
        res.status(500).json({ msg: "Server Error Deleting Expense" });
    }
});

// Monthly Cap
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const capDoc = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(capDoc ? [capDoc] : []);
  } catch (error) { console.error("GET MonthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const { cap } = req.body;
    await MonthlyCap.deleteOne({ userId: req.userId });

    if (cap !== undefined && cap !== null && !isNaN(parseFloat(cap)) && parseFloat(cap) > 0) {
      const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) });
      await newCap.save();
      res.status(200).json([newCap]);
    } else {
      res.status(200).json([]);
    }
  } catch (error) { console.error("POST MonthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});


app.listen(PORT, () => console.log(`Server successfully running on port ${PORT}`));
