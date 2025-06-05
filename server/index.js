// server/index.js
require('dotenv').config(); // Loads .env variables from server/.env (or project root if that's where it is)
const express = require('express');
const cors = require('cors'); 
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com", // Your frontend production URL
  "http://budget.technickservices.com",  // If you also support HTTP for frontend
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
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Explicitly list allowed methods
  allowedHeaders: "Content-Type, Authorization, X-Requested-With", // Explicitly list allowed headers client can send
  credentials: true, 
  optionsSuccessStatus: 204 // Standard for successful preflight (some browsers default to 200)
};

// IMPORTANT: Handle OPTIONS requests globally and early for preflights.
// The cors(corsOptions) middleware passed to app.options should apply the headers.
app.options('*', cors(corsOptions)); 

// Then apply CORS for all other requests
app.use(cors(corsOptions));

// --- Standard Middleware after CORS ---
app.use(express.json()); // To parse JSON request bodies

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
// It's generally better to construct the full URI in .env as MONGO_URI
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass, "****")}`); // Mask password in log
mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => {
    console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message);
    // console.error('Full MongoDB Error:', err); // Uncomment for more verbose DB connection errors
});

// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");

// Import route handlers and middleware (ensure paths are correct)
const authRoutes = require('./routes/auth'); 
const authMiddleware = require('./middleware/authMiddleware'); 
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

// Test route at the root of the server
app.get('/server-status', (req, res) => {
  console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server (budget-api) is alive and the /server-status route is directly on the app object.');
});

// Mount authentication routes
try {
    console.log("SERVER LOG: Attempting to require and mount ./routes/auth ...");
    app.use('/api/auth', authRoutes); // All routes in auth.js will be prefixed with /api/auth
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

// --- Protected Data API Routes ---
// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  console.log(`SERVER LOG: GET /api/budgets for userId: ${req.userId}`);
  try {
    const budgets = await Budget.find({ userId: req.userId });
    // console.log(`SERVER LOG: Found ${budgets.length} budgets for userId: ${req.userId}`);
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
    const newBudget = new Budget({ name, max, id: clientId, userId: req.userId });
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
    // console.log(`SERVER LOG: Found ${expenses.length} expenses for userId: ${req.userId}`);
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
    const newExpense = new Expense({ description, amount, budgetId, id: clientId, userId: req.userId });
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
    // console.log(`SERVER LOG: Found monthlyCap for userId ${req.userId}:`, capDoc);
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


// --- 404 Handlers (should be placed after all actual route handlers) ---
// Catch-all for API routes that are not found
app.use('/api/*', (req, res) => {
    console.log(`SERVER LOG: API 404. No handler for API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// General 404 for any other unhandled routes (e.g., non-API GET requests if not serving client static files)
app.use('*', (req, res) => {
  console.log(`SERVER LOG: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on this server (budget-api).`);
});


// --- Global Error Handler (should be the very last middleware) ---
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
  console.log(`SERVER LOG: Test basic server status with: curl http://localhost:${PORT}/server-status`);
  console.log(`SERVER LOG: Test auth router GET with: curl http://localhost:${PORT}/api/auth/test-auth-route (from server/routes/auth.js)`);
});
