// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com", // HTTPS only as requested
  "http://localhost:3000"               // For local client development
];

const corsOptions = {
  origin: function (origin, callback) {
    // ---- START ADDED LOGGING ----
    console.log(`SERVER CORS: Request received. Origin header: ${origin}`); // MODIFIED
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`SERVER CORS: Origin ${origin} is ALLOWED.`); // MODIFIED
      callback(null, true);
    } else {
      console.warn(`SERVER CORS: Origin ${origin} is BLOCKED. Not in allowed list: [${allowedOrigins.join(', ')}]`); // MODIFIED
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
    // ---- END ADDED LOGGING ----
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204
};

// ---- START ADDED MIDDLEWARE for general request logging ----
// This middleware should be placed before your CORS and route handling
app.use((req, res, next) => {
  console.log(`SERVER INCOMING REQUEST: Method: ${req.method}, Path: ${req.path}, Origin: ${req.headers.origin}`);
  // Optionally, log all headers if needed for deep debugging, but it can be verbose
  // console.log(`SERVER INCOMING REQUEST HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});
// ---- END ADDED MIDDLEWARE ----

// Handle OPTIONS requests globally FIRST
app.options('*', cors(corsOptions));
// Then apply CORS for all other requests
app.use(cors(corsOptions));

// Standard Middleware after CORS
app.use(express.json()); // To parse JSON request bodies

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
// Ensure MONGO_URI is correctly defined in your root .env file
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass || "YOUR_DB_PASS", "****")}`);
mongoose.connect(mongoConnectionString)
  .then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
  .catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));
// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");
// Ensure paths to these files are correct relative to server/index.js
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

// Test route
app.get('/server-status', (req, res) => {
    console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
    res.status(200).send('Backend server (budget-api) is alive.');
});

// Mount authentication routes
try {
    console.log("SERVER LOG: Attempting to mount ./routes/auth ...");
    app.use('/api/auth', authRoutes);
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

// --- Protected Data API Routes ---
// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: GET /api/budgets for userId: ${req.userId}`);
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: POST /api/budgets for userId: ${req.userId} with body:`, req.body);
  try {
    const { id, name, max } = req.body;
    const newBudget = new Budget({ userId: req.userId, id, name, max });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Saving Budget" }); }
});

app.delete("/api/budgets/:id", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: DELETE /api/budgets/${req.params.id} for userId: ${req.userId}`);
  try {
    // findOneAndDelete to ensure the budget belongs to the user making the request
    const budget = await Budget.findOneAndDelete({ id: req.params.id, userId: req.userId });
    if (!budget) {
      return res.status(404).json({ msg: "Budget not found or not authorized to delete" });
    }
    // Also delete associated expenses
    await Expense.deleteMany({ budgetId: req.params.id, userId: req.userId });
    res.status(200).json({ msg: "Budget and associated expenses deleted" });
  } catch (error) { console.error(`DELETE /api/budgets/${req.params.id} Error:`, error); res.status(500).json({ msg: "Server Error Deleting Budget" }); }
});


// Expenses
app.get("/api/expenses", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: GET /api/expenses for userId: ${req.userId}`);
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.status(200).json(expenses);
  } catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Fetching Expenses" }); }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: POST /api/expenses for userId: ${req.userId} with body:`, req.body);
  try {
    const { id, description, amount, budgetId } = req.body;
    const newExpense = new Expense({ userId: req.userId, id, description, amount, budgetId });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Saving Expense" }); }
});

app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: DELETE /api/expenses/${req.params.id} for userId: ${req.userId}`);
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ msg: "Expense not found or not authorized to delete" });
    }
    res.status(200).json({ msg: "Expense deleted" });
  } catch (error) { console.error(`DELETE /api/expenses/${req.params.id} Error:`, error); res.status(500).json({ msg: "Server Error Deleting Expense" }); }
});

// Monthly Cap
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  // console.log(`SERVER LOG: GET /api/monthlyCap for userId: ${req.userId}`);
  try {
    const cap = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(cap ? [cap] : []); // Return as array to match client expectation
  } catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  const { cap } = req.body;
  // console.log(`SERVER LOG: POST /api/monthlyCap for userId: ${req.userId} with cap: ${cap}`);
  if (cap === undefined || cap === null || parseFloat(cap) < 0) {
    return res.status(400).json({ msg: "Invalid cap amount provided." });
  }
  try {
    const updatedCap = await MonthlyCap.findOneAndUpdate(
      { userId: req.userId },
      { cap: parseFloat(cap) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json([updatedCap]); // Return as array
  } catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});


app.listen(PORT, () => {
  console.log(`SERVER LOG: Backend (budget-api) is running on port ${PORT}`);
});
