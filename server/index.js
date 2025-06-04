// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000; // This is the internal port the backend listens on

// --- CORS Configuration ---
// Define the allowed origins. Add others if needed (e.g., www version, localhost for dev)
const allowedOrigins = [
  "https://budget.technickservices.com", // Your frontend production URL
  "http://budget.technickservices.com",  // If served over HTTP
  "http://localhost:3000"               // For local client development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // OR if origin is in allowedOrigins list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass, "****")}`);
mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => {
    console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message);
});

// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");

app.get('/server-status', (req, res) => { // This route is on the backend at /server-status
  console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server (budget-api) is alive and the /server-status route is directly on the app object.');
});

try {
    console.log("SERVER LOG: Attempting to require and mount ./routes/auth ...");
    const authRoutes = require('./routes/auth'); 
    app.use('/api/auth', authRoutes); // All routes in auth.js will be prefixed with /api/auth
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

const authMiddleware = require('./middleware/authMiddleware'); 
const Budget = require("./models/Budget"); 
const Expense = require("./models/Expense"); 
const MonthlyCap = require('./models/MonthlyCap'); 

// --- Protected Data API Routes ---
// (These should be the same as the last full backend server/index.js version)
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try { const budgets = await Budget.find({ userId: req.userId }); res.status(200).json(budgets); }
  catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});
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


// --- 404 Handlers ---
app.use('/api/*', (req, res) => {
    console.log(`SERVER LOG: API 404. No handler for API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});
app.use('*', (req, res) => {
  console.log(`SERVER LOG: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on this server (budget-api).`);
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("SERVER ERROR: Unhandled application error:", err.stack);
  res.status(500).json({ msg: 'Internal Server Error. Something broke!' });
});

// --- Start Server ---
app.listen(PORT, (err) => {
  if (err) {
    console.error(`SERVER ERROR: Failed to start express server on port ${PORT}:`, err);
    return;
  }
  console.log(`SERVER LOG: Express server (budget-api) is listening on port ${PORT}`);
});
