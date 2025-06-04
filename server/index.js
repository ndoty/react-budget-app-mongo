// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Make sure cors is required
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- EXTREMELY PERMISSIVE CORS FOR DEBUGGING ---
// This will allow all origins, all methods, all headers.
// If this works, the issue is definitely with the specificity of your previous corsOptions.
console.log("SERVER LOG: USING TEMPORARY PERMISSIVE CORS FOR DEBUGGING!");
app.use(cors({
    origin: '*', // Allow all origins
    methods: '*', // Allow all methods
    allowedHeaders: '*', // Allow all headers
    credentials: true, // If needed
    optionsSuccessStatus: 204
}));
// The above app.use(cors({...})) should handle OPTIONS requests automatically.
// So, app.options('*', cors(corsOptions)); might not be strictly necessary when origin is '*'.

app.use(express.json()); 

// --- MongoDB Connection ---
// ... (same as your previous version)
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;
mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));


// --- ROUTES ---
// ... (same as your previous version: /server-status, authRoutes, data routes)
console.log("SERVER LOG: Registering routes...");
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
// ... (Include all your other API routes for budgets, expenses, monthlyCap as previously defined)
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
// ... (same as your previous version)
app.use('/api/*', (req, res) => {
    console.log(`SERVER LOG: API 404. No handler for API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});
app.use('*', (req, res) => {
  console.log(`SERVER LOG: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on this server (budget-api).`);
});
app.use((err, req, res, next) => {
  console.error("SERVER ERROR: Unhandled application error:", err.stack);
  res.status(500).json({ msg: 'Internal Server Error. Something broke!' });
});

// --- Start Server ---
app.listen(PORT, (err) => {
  if (err) { console.error(`SERVER ERROR: Failed to start express server on port ${PORT}:`, err); return; }
  console.log(`SERVER LOG: Express server (budget-api) is listening on port ${PORT}`);
});
