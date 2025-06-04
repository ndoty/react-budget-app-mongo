// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://budget.technickservices.com",
  "http://localhost:3000" // For local client development
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");
app.get('/server-status', (req, res) => {
  console.log(`SERVER LOG: GET /server-status route hit.`);
  res.status(200).send('Backend server is alive.');
});
app.use('/api/auth', authRoutes);
console.log("SERVER LOG: /api/auth routes mounted.");

// --- Protected API Routes ---
// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  console.log(`SERVER LOG: GET /api/budgets for userId: ${req.userId}`);
  try {
    const budgets = await Budget.find({ userId: req.userId });
    console.log(`SERVER LOG: Found ${budgets.length} budgets for userId: ${req.userId}`);
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  const { name, max, id: clientId } = req.body;
  console.log(`SERVER LOG: POST /api/budgets for userId: ${req.userId} with data:`, {name, max, clientId});
  try {
    if (name === undefined || max === undefined || clientId === undefined) {
        return res.status(400).json({ msg: "Missing required budget fields (id, name, max)."});
    }
    const newBudget = new Budget({ name, max, id: clientId, userId: req.userId }); // Ensure userId is saved
    await newBudget.save();
    console.log(`SERVER LOG: Budget "${name}" saved for userId: ${req.userId}`);
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Creating Budget" }); }
});

app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    console.log(`SERVER LOG: DELETE /api/budgets/${req.params.clientId} for userId: ${req.userId}`);
    try {
        const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!budget) return res.status(404).json({ msg: "Budget not found or user not authorized" });
        await Expense.updateMany( { userId: req.userId, budgetId: req.params.clientId }, { $set: { budgetId: "Uncategorized" } } );
        console.log(`SERVER LOG: Budget ${req.params.clientId} deleted for userId: ${req.userId}`);
        res.json({ msg: "Budget removed" });
    } catch (error) { console.error("DELETE /api/budgets/:clientId Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Budget" }); }
});

// Expenses
app.get("/api/expenses", authMiddleware, async (req, res) => {
  console.log(`SERVER LOG: GET /api/expenses for userId: ${req.userId}`);
  try {
    const expenses = await Expense.find({ userId: req.userId });
    console.log(`SERVER LOG: Found ${expenses.length} expenses for userId: ${req.userId}`);
    res.status(200).json(expenses);
  } catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  const { description, amount, budgetId, id: clientId } = req.body;
  console.log(`SERVER LOG: POST /api/expenses for userId: ${req.userId} with data:`, {description, amount, budgetId, clientId});
  try {
     if (description === undefined || amount === undefined || budgetId === undefined || clientId === undefined) {
        return res.status(400).json({ msg: "Missing required expense fields."});
    }
    const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId }); // Ensure userId is saved
    await newExpense.save();
    console.log(`SERVER LOG: Expense "${description}" saved for userId: ${req.userId}`);
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Creating Expense" }); }
});

app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    console.log(`SERVER LOG: DELETE /api/expenses/${req.params.clientId} for userId: ${req.userId}`);
    try {
        const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId });
        if (!expense) return res.status(404).json({ msg: "Expense not found or user not authorized" });
        console.log(`SERVER LOG: Expense ${req.params.clientId} deleted for userId: ${req.userId}`);
        res.json({ msg: "Expense removed" });
    } catch (error) { console.error("DELETE /api/expenses/:clientId Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Expense" }); }
});

// Monthly Cap
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  console.log(`SERVER LOG: GET /api/monthlyCap for userId: ${req.userId}`);
  try {
    const capDoc = await MonthlyCap.findOne({ userId: req.userId });
    console.log(`SERVER LOG: Found monthlyCap for userId ${req.userId}:`, capDoc);
    res.status(200).json(capDoc ? [capDoc] : []);
  } catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  const { cap } = req.body;
  console.log(`SERVER LOG: POST /api/monthlyCap for userId: ${req.userId} with cap: ${cap}`);
  try {
    await MonthlyCap.findOneAndDelete({ userId: req.userId });
    if (cap !== undefined && cap !== null && !isNaN(parseFloat(cap)) && parseFloat(cap) > 0) {
      const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) });
      await newCap.save();
      console.log(`SERVER LOG: MonthlyCap saved for userId ${req.userId} with value: ${newCap.cap}`);
      res.status(200).json([newCap]);
    } else {
      console.log(`SERVER LOG: MonthlyCap cleared for userId ${req.userId}`);
      res.status(200).json([]);
    }
  } catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});

// --- 404 and Error Handlers ---
app.use('/api/*', (req, res) => {
    console.log(`SERVER LOG: API 404. No handler for API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});
app.use('*', (req, res) => {
  console.log(`SERVER LOG: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on server.`);
});
app.use((err, req, res, next) => {
  console.error("SERVER ERROR: Unhandled application error:", err.stack);
  res.status(500).json({ msg: 'Internal Server Error. Something broke!' });
});

app.listen(PORT, (err) => {
  if (err) { console.error(`SERVER ERROR: Failed to start express server on port ${PORT}:`, err); return; }
  console.log(`SERVER LOG: Express server is listening on port ${PORT}`);
});
