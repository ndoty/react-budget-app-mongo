// server/index.js
require('dotenv').config(); // Loads .env variables from server/.env
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Standard Middleware ---
app.use(cors()); 
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

app.get('/server-status', (req, res) => {
  console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server is alive and the /server-status route is directly on the app object.');
});

// Mount authentication routes (from server/routes/auth.js)
try {
    console.log("SERVER LOG: Attempting to require and mount ./routes/auth ...");
    const authRoutes = require('./routes/auth'); // Path should be correct if auth.js is in routes/
    app.use('/api/auth', authRoutes); 
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

// --- Import other necessary files for data routes AFTER auth routes setup ---
const authMiddleware = require('./middleware/authMiddleware'); // Ensure path is correct
const Budget = require("./models/Budget"); // Ensure path is correct
const Expense = require("./models/Expense"); // Ensure path is correct
const MonthlyCap = require('./models/MonthlyCap'); // Ensure path is correct

// --- Protected Data API Routes (Uncomment and use after auth is fully working) ---
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
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on server.`);
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
  console.log(`SERVER LOG: Express server is listening on port ${PORT}`);
  console.log(`SERVER LOG: Test basic server status with: curl http://localhost:${PORT}/server-status`);
  console.log(`SERVER LOG: Test auth router GET with: curl http://localhost:${PORT}/api/auth/test-auth-route`);
});
