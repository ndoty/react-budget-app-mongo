// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://budget.technickservices.com",
  "http://localhost:3000" // For local client development if you test against this backend
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
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204
};

// Handle OPTIONS requests globally FIRST
app.options('*', cors(corsOptions)); 
// Then apply CORS for all other requests
app.use(cors(corsOptions));

app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass || "YOUR_DB_PASS", "****")}`);
mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");
const authRoutes = require('./routes/auth'); 
const authMiddleware = require('./middleware/authMiddleware'); 
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

app.get('/server-status', (req, res) => res.status(200).send('Backend server (budget-api) is alive.'));
app.use('/api/auth', authRoutes);
console.log("SERVER LOG: /api/auth routes mounted.");

// --- Protected Data API Routes ---
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try { const budgets = await Budget.find({ userId: req.userId }); res.status(200).json(budgets); }
  catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});
app.post("/api/budgets", authMiddleware, async (req, res) => {
  try { const { name, max, id: clientId } = req.body; if (!name||max===undefined||!clientId) { return res.status(400).json({ msg: "Missing budget fields"}); } const newBudget = new Budget({ name, max, id: clientId, userId: req.userId }); await newBudget.save(); res.status(201).json(newBudget); }
  catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Creating Budget" }); }
});
app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    try { const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!budget) { return res.status(404).json({ msg: "Budget not found" }); } await Expense.updateMany( { userId: req.userId, budgetId: req.params.clientId }, { $set: { budgetId: "Uncategorized" } } ); res.json({ msg: "Budget removed" }); }
    catch (error) { console.error("DELETE /api/budgets Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Budget" }); }
});
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try { const expenses = await Expense.find({ userId: req.userId }); res.status(200).json(expenses); }
  catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});
app.post("/api/expenses", authMiddleware, async (req, res) => {
  try { const { description, amount, budgetId, id: clientId } = req.body; if (!description||amount===undefined||!budgetId||!clientId) { return res.status(400).json({ msg: "Missing expense fields"}); } const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId }); await newExpense.save(); res.status(201).json(newExpense); }
  catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Creating Expense" }); }
});
app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    try { const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!expense) { return res.status(404).json({ msg: "Expense not found" }); } res.json({ msg: "Expense removed" }); }
    catch (error) { console.error("DELETE /api/expenses Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Expense" }); }
});
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try { const capDoc = await MonthlyCap.findOne({ userId: req.userId }); res.status(200).json(capDoc ? [capDoc] : []); }
  catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Cap" }); }
});
app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try { const { cap } = req.body; await MonthlyCap.findOneAndDelete({ userId: req.userId }); if (cap!==undefined && cap!==null && !isNaN(parseFloat(cap)) && parseFloat(cap)>0) { const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) }); await newCap.save(); res.status(200).json([newCap]); } else { res.status(200).json([]); } }
  catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Cap" }); }
});

// --- 404 and Error Handlers ---
app.use('/api/*', (req, res) => res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` }));
app.use('*', (req, res) => res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. (budget-api)`));
app.use((err, req, res, next) => { console.error("SERVER ERROR (Global):", err.stack); res.status(500).json({ msg: 'Internal Server Error' }); });

app.listen(PORT, (err) => {
  if (err) { console.error(`SERVER ERROR: Failed to start on port ${PORT}:`, err); return; }
  console.log(`SERVER LOG: Express server (budget-api) listening on port ${PORT}`);
});
