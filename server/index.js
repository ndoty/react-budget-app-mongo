require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

// Route Handlers
const authRoutes = require('./routes/auth');
// Import models (used in data routes below)
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple Test Route - place this VERY EARLY
app.get('/ping', (req, res) => {
  console.log("Server was PINGED at /ping");
  res.status(200).send('pong');
});

// Standard Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${user}:${pass}@technickservices.com/React-Budget-App?authSource=admin`; // Use your actual connection string

mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully! Server is attempting to start...'))
.catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Full MongoDB Error:', err);
    // Consider exiting if DB connection fails, as most of the app depends on it
    // process.exit(1); 
});


// --- ROUTES ---

// Public Authentication Routes
app.use('/api/auth', authRoutes); // All routes in auth.js will be prefixed with /api/auth

// --- Protected API Routes (all routes below this will require a token via authMiddleware) ---

// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { name, max, id: clientId } = req.body; // id is client-generated UUID
    if (name === undefined || max === undefined || clientId === undefined) { // Stricter check
        return res.status(400).json({ msg: "Missing required budget fields (id, name, max)."});
    }
    const newBudget = new Budget({ name, max, id: clientId, userId: req.userId });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Creating Budget" }); }
});

app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!budget) {
            return res.status(404).json({ msg: "Budget not found or user not authorized" });
        }
        // The client context uses "Uncategorized" as a string ID
        await Expense.updateMany(
            { userId: req.userId, budgetId: req.params.clientId },
            { $set: { budgetId: "Uncategorized" } }
        );
        res.json({ msg: "Budget removed" }); // Confirm deletion
    } catch (error) {
        console.error("DELETE /api/budgets/:clientId Error:", error.message);
        res.status(500).json({ msg: "Server Error Deleting Budget" });
    }
});


// Expenses
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.status(200).json(expenses);
  } catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const { description, amount, budgetId, id: clientId } = req.body; // id is client-generated UUID
     if (description === undefined || amount === undefined || budgetId === undefined || clientId === undefined) { // Stricter check
        return res.status(400).json({ msg: "Missing required expense fields (id, description, amount, budgetId)."});
    }
    const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Creating Expense" }); }
});

app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!expense) {
            return res.status(404).json({ msg: "Expense not found or user not authorized" });
        }
        res.json({ msg: "Expense removed" });
    } catch (error) {
        console.error("DELETE /api/expenses/:clientId Error:", error.message);
        res.status(500).json({ msg: "Server Error Deleting Expense" });
    }
});

// Monthly Cap
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const capDoc = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(capDoc ? [capDoc] : []); // Client expects an array
  } catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const { cap } = req.body; // Expects { cap: number } or an empty object/null cap to remove
    await MonthlyCap.findOneAndDelete({ userId: req.userId }); // Simpler: delete then recreate if cap is valid

    if (cap !== undefined && cap !== null && !isNaN(parseFloat(cap)) && parseFloat(cap) > 0) {
      const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) });
      await newCap.save();
      res.status(200).json([newCap]); // Return as array
    } else {
      res.status(200).json([]); // Indicate cap removed or set to zero by returning empty array
    }
  } catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});

// Catch-all for 404s specifically for /api routes if no other /api route matched
app.use('/api/*', (req, res) => {
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => console.log(`Server successfully running on port ${PORT}`));
