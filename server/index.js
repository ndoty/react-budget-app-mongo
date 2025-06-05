// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const http = require('http'); // Added
const WebSocket = require('ws'); // Added

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`SERVER CORS: Request received. Origin header: ${origin}`);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`SERVER CORS: Origin ${origin} is ALLOWED.`);
      callback(null, true);
    } else {
      console.warn(`SERVER CORS: Origin ${origin} is BLOCKED. Not in allowed list: [${allowedOrigins.join(', ')}]`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204
};

// General request logging middleware
app.use((req, res, next) => {
  console.log(`SERVER INCOMING REQUEST: Method: ${req.method}, Path: ${req.path}, Origin: ${req.headers.origin}`);
  next();
});

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass || "YOUR_DB_PASS", "****")}`);
mongoose.connect(mongoConnectionString) // Removed useNewUrlParser and useUnifiedTopology
  .then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
  .catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// --- ROUTES ---
console.log("SERVER LOG: Registering routes...");
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

app.get('/server-status', (req, res) => {
    console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
    res.status(200).send('Backend server (budget-api) is alive.');
});

try {
    console.log("SERVER LOG: Attempting to mount ./routes/auth ...");
    app.use('/api/auth', authRoutes);
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

// Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});

app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { id, name, max } = req.body;
    const newBudget = new Budget({ userId: req.userId, id, name, max });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Saving Budget" }); }
});

app.delete("/api/budgets/:id", authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ id: req.params.id, userId: req.userId });
    if (!budget) {
      return res.status(404).json({ msg: "Budget not found or not authorized to delete" });
    }
    await Expense.deleteMany({ budgetId: req.params.id, userId: req.userId });
    res.status(200).json({ msg: "Budget and associated expenses deleted" });
  } catch (error) { console.error(`DELETE /api/budgets/${req.params.id} Error:`, error); res.status(500).json({ msg: "Server Error Deleting Budget" }); }
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
    const { id, description, amount, budgetId } = req.body;
    const newExpense = new Expense({ userId: req.userId, id, description, amount, budgetId });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error Saving Expense" }); }
});

app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
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
  try {
    const cap = await MonthlyCap.findOne({ userId: req.userId });
    res.status(200).json(cap ? [cap] : []);
  } catch (error) { console.error("GET /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Fetching Monthly Cap" }); }
});

app.post("/api/monthlyCap", authMiddleware, async (req, res) => {
  const { cap } = req.body;
  if (cap === undefined || cap === null || parseFloat(cap) < 0) {
    return res.status(400).json({ msg: "Invalid cap amount provided." });
  }
  try {
    const updatedCap = await MonthlyCap.findOneAndUpdate(
      { userId: req.userId },
      { cap: parseFloat(cap) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json([updatedCap]);
  } catch (error) { console.error("POST /api/monthlyCap Error:", error); res.status(500).json({ msg: "Server Error Setting Monthly Cap" }); }
});

// ---- WebSocket Server Setup ----
const server = http.createServer(app); // Create HTTP server from Express app

const wss = new WebSocket.Server({ server, path: "/ws" }); // Attach WebSocket server to HTTP server, define a path

wss.on('connection', (ws) => {
  console.log('SERVER WebSocket: Client connected');

  ws.on('message', (message) => {
    console.log(`SERVER WebSocket: Received message => ${message}`);
    // Example: Echo message back to client
    // Or broadcast to all clients:
    // wss.clients.forEach(client => {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(String(message)); // Ensure message is a string or Buffer
    //   }
    // });
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('SERVER WebSocket: Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('SERVER WebSocket: Error:', error);
  });

  ws.send('Welcome to the WebSocket server!');
});
// ---- END WebSocket Server Setup ----

server.listen(PORT, () => { // Changed from app.listen to server.listen
  console.log(`SERVER LOG: Backend (budget-api) with WebSocket support is running on port ${PORT}`);
  console.log(`SERVER LOG: WebSocket server available at ws://localhost:${PORT}/ws (or wss://yourdomain/ws in production)`);
});
