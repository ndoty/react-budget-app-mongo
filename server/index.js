// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Ensure 'cors' is installed (it is in your package.json)
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://budget.technickservices.com", // In case you test without HTTPS on frontend side sometimes
  "http://localhost:3000"              // For local client development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // OR if origin is in allowedOrigins list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin} - Not in allowedOrigins:`, allowedOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With", // Crucial: Authorization must be listed
  credentials: true,
  optionsSuccessStatus: 204 // Respond to preflight with 204 No Content
};

// Apply CORS middleware to handle all requests, including preflight OPTIONS.
// This should be one of the first middleware.
app.use(cors(corsOptions));

// --- Standard Middleware after CORS ---
app.use(express.json()); // To parse JSON request bodies

// --- MongoDB Connection ---
// (Your MongoDB connection logic - ensure it's correct and working)
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;
mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));


// --- ROUTES ---
// (Your routes: /server-status, /api/auth, /api/budgets, etc. as defined before)
// Ensure these are defined AFTER the app.use(cors(corsOptions)); and app.use(express.json());
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

app.get('/server-status', (req, res) => res.status(200).send('Backend server (budget-api) is alive.'));
app.use('/api/auth', authRoutes);

app.get("/api/budgets", authMiddleware, async (req, res) => {
  try { const budgets = await Budget.find({ userId: req.userId }); res.status(200).json(budgets); }
  catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});
// ... (all other POST, DELETE routes for /api/budgets, /api/expenses, /api/monthlyCap)
app.post("/api/budgets", authMiddleware, async (req, res) => {
  try { const { name, max, id: clientId } = req.body; if (name === undefined || max === undefined || clientId === undefined) { return res.status(400).json({ msg: "Missing required budget fields (id, name, max)."}); } const newBudget = new Budget({ name, max, id: clientId, userId: req.userId }); await newBudget.save(); res.status(201).json(newBudget); }
  catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Creating Budget" }); }
});
app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => {
    try { const budget = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!budget) { return res.status(404).json({ msg: "Budget not found or user not authorized" }); } await Expense.updateMany( { userId: req.userId, budgetId: req.params.clientId }, { $set: { budgetId: "Uncategorized" } } ); res.json({ msg: "Budget removed" }); }
    catch (error) { console.error("DELETE /api/budgets/:clientId Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Budget" }); }
});
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try { const expenses = await Expense.find({ userId: req.userId }); res.status(200).json(expenses); }
  catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});
app.post("/api/expenses", authMiddleware, async (req, res) => {
  try { const { description, amount, budgetId, id: clientId } = req.body; if (description === undefined || amount === undefined || budgetId === undefined || clientId === undefined) { return res.status(400).json({ msg: "Missing required expense fields."}); } const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId }); await newExpense.save(); res.status(201).json(newExpense); }
  catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Creating Expense" }); }
});
app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => {
    try { const expense = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!expense) { return res.status(404).json({ msg: "Expense not found or user not authorized" }); } res.json({ msg: "Expense removed" }); }
    catch (error) { console.error("DELETE /api/expenses/:clientId Error:", error.message); res.status(500).json({ msg: "Server Error Deleting Expense" }); }
});
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try { const capDoc = await MonthlyCap.findOne({ userId: req.userId }); res.status(200).json(capDoc ? [capDoc] : []); }
  catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});
app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try { const { cap } = req.body; await MonthlyCap.findOneAndDelete({ userId: req.userId }); if (cap !== undefined && cap !== null && !isNaN(parseFloat(cap)) && parseFloat(cap) > 0) { const newCap = new MonthlyCap({ userId: req.userId, cap: parseFloat(cap) }); await newCap.save(); res.status(200).json([newCap]); } else { res.status(200).json([]); } }
  catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});


// --- 404 Handlers and Error Handler ---
// (Same as before)
app.use('/api/*', (req, res) => res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` }));
app.use('*', (req, res) => res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. (budget-api)`));
app.use((err, req, res, next) => { console.error("SERVER ERROR (Global):", err.stack); res.status(500).json({ msg: 'Internal Server Error' }); });


app.listen(PORT, (err) => {
  if (err) { console.error(`SERVER ERROR: Failed to start on port ${PORT}:`, err); return; }
  console.log(`SERVER LOG: Express server (budget-api) listening on port ${PORT}`);
});
