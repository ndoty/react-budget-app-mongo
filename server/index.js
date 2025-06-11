// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoConnectionString)
  .then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
  .catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// --- WebSocket Server Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

function broadcastDataUpdate(updateType) {
  const message = JSON.stringify({ type: updateType });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('SERVER WebSocket: Client connected');
  ws.on('close', () => console.log('SERVER WebSocket: Client disconnected'));
  ws.on('error', (error) => console.error('SERVER WebSocket: Error:', error));
});

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');
const Income = require('./models/Income'); // MODIFIED: Import the new Income model

app.use('/api/auth', authRoutes);
app.get('/server-status', (req, res) => res.status(200).send('Backend server (budget-api) is alive.'));

// Budgets Routes
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const newBudget = new Budget({ ...req.body, userId: req.userId });
    await newBudget.save();
    broadcastDataUpdate('BUDGET_DATA_UPDATED');
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.put("/api/budgets/:id", authMiddleware, async (req, res) => {
  try {
    const { name, max } = req.body;
    const updatedBudget = await Budget.findOneAndUpdate({ id: req.params.id, userId: req.userId }, { name, max }, { new: true });
    if (!updatedBudget) return res.status(404).json({ msg: "Budget not found" });
    broadcastDataUpdate('BUDGET_DATA_UPDATED');
    res.json(updatedBudget);
  } catch (error) { console.error("PUT /api/budgets/:id Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.delete("/api/budgets/:id", authMiddleware, async (req, res) => {
  try {
    await Budget.deleteOne({ id: req.params.id, userId: req.userId });
    await Expense.deleteMany({ budgetId: req.params.id, userId: req.userId });
    broadcastDataUpdate('BUDGET_DATA_UPDATED');
    broadcastDataUpdate('EXPENSE_DATA_UPDATED');
    res.status(200).json({ msg: "Budget deleted" });
  } catch (error) { console.error("DELETE /api/budgets/:id Error:", error); res.status(500).json({ msg: "Server Error" }); }
});

// Expenses Routes
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId });
    res.status(200).json(expenses);
  } catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const newExpense = new Expense({ ...req.body, userId: req.userId });
    await newExpense.save();
    broadcastDataUpdate('EXPENSE_DATA_UPDATED');
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.put("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    const { description, amount, budgetId } = req.body;
    const updatedExpense = await Expense.findOneAndUpdate({ id: req.params.id, userId: req.userId }, { description, amount, budgetId }, { new: true });
    if (!updatedExpense) return res.status(404).json({ msg: "Expense not found" });
    broadcastDataUpdate('EXPENSE_DATA_UPDATED');
    res.json(updatedExpense);
  } catch (error) { console.error("PUT /api/expenses/:id Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    await Expense.deleteOne({ id: req.params.id, userId: req.userId });
    broadcastDataUpdate('EXPENSE_DATA_UPDATED');
    res.status(200).json({ msg: "Expense deleted" });
  } catch (error) { console.error("DELETE /api/expenses/:id Error:", error); res.status(500).json({ msg: "Server Error" }); }
});

// MODIFIED: Added Income Routes
app.get("/api/income", authMiddleware, async (req, res) => {
  try {
    const income = await Income.find({ userId: req.userId }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (error) { console.error("GET /api/income Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.post("/api/income", authMiddleware, async (req, res) => {
  try {
    const newIncome = new Income({ ...req.body, userId: req.userId });
    await newIncome.save();
    broadcastDataUpdate('INCOME_DATA_UPDATED');
    res.status(201).json(newIncome);
  } catch (error) { console.error("POST /api/income Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.delete("/api/income/:id", authMiddleware, async (req, res) => {
  try {
    await Income.deleteOne({ id: req.params.id, userId: req.userId });
    broadcastDataUpdate('INCOME_DATA_UPDATED');
    res.status(200).json({ msg: "Income deleted" });
  } catch (error) { console.error("DELETE /api/income/:id Error:", error); res.status(500).json({ msg: "Server Error" }); }
});

// Monthly Cap Routes
app.get("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const cap = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(cap ? [cap] : []);
  } catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error" }); }
});
app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  try {
    const updatedCap = await MonthlyCap.findOneAndUpdate({ userId: req.userId }, { cap: req.body.cap }, { new: true, upsert: true });
    broadcastDataUpdate('MONTHLY_CAP_UPDATED');
    res.status(200).json([updatedCap]);
  } catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error" }); }
});

server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
