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
  "http://localhost:3000" 
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

// 1. Apply global OPTIONS handler with specific CORS options.
//    The `cors` middleware itself should handle responding to OPTIONS preflight.
app.options('*', cors(corsOptions)); 

// 2. Apply CORS for all other requests.
app.use(cors(corsOptions));

// 3. Then other middleware like express.json()
app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${mongoUser}:${mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
.catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// --- ROUTES ---
const authRoutes = require('./routes/auth'); 
const authMiddleware = require('./middleware/authMiddleware'); 
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');

app.get('/server-status', (req, res) => res.status(200).send('Backend server (budget-api) is alive.'));
app.use('/api/auth', authRoutes);

// Protected Data API Routes (ensure these are all present)
app.get("/api/budgets", authMiddleware, async (req, res) => { try { const d = await Budget.find({ userId: req.userId }); res.status(200).json(d); } catch (e) { res.status(500).json({ msg: "Err Budgets" }); }});
app.post("/api/budgets", authMiddleware, async (req, res) => { try { const { name, max, id } = req.body; const n = new Budget({ name, max, id, userId: req.userId }); await n.save(); res.status(201).json(n); } catch (e) { res.status(500).json({ msg: "Err Budgets POST" }); }});
app.delete("/api/budgets/:clientId", authMiddleware, async (req, res) => { try { const b = await Budget.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!b) { return res.status(404).json({ msg: "Budget not found" }); } await Expense.updateMany({ userId: req.userId, budgetId: req.params.clientId }, { $set: { budgetId: "Uncategorized" }}); res.json({ msg: "Budget removed" }); } catch (e) { res.status(500).json({ msg: "Err Budgets DELETE" }); }});
app.get("/api/expenses", authMiddleware, async (req, res) => { try { const d = await Expense.find({ userId: req.userId }); res.status(200).json(d); } catch (e) { res.status(500).json({ msg: "Err Expenses" }); }});
app.post("/api/expenses", authMiddleware, async (req, res) => { try { const { description, amount, budgetId, id } = req.body; const n = new Expense({ description, amount, budgetId, id, userId: req.userId }); await n.save(); res.status(201).json(n); } catch (e) { res.status(500).json({ msg: "Err Expenses POST" }); }});
app.delete("/api/expenses/:clientId", authMiddleware, async (req, res) => { try { const e = await Expense.findOneAndDelete({ id: req.params.clientId, userId: req.userId }); if (!e) { return res.status(404).json({ msg: "Expense not found" }); } res.json({ msg: "Expense removed" }); } catch (e) { res.status(500).json({ msg: "Err Expenses DELETE" }); }});
app.get("/api/monthlyCap", authMiddleware, async (req, res) => { try { const d = await MonthlyCap.findOne({ userId: req.userId }); res.status(200).json(d ? [d] : []); } catch (e) { res.status(500).json({ msg: "Err Cap GET" }); }});
app.post("/api/monthlyCap", authMiddleware, async (req, res) => { try { const { cap } = req.body; await MonthlyCap.findOneAndDelete({ userId: req.userId }); if (cap > 0) { const n = new MonthlyCap({ userId: req.userId, cap }); await n.save(); res.status(200).json([n]); } else { res.status(200).json([]); } } catch (e) { res.status(500).json({ msg: "Err Cap POST" }); }});

// --- 404 and Error Handlers ---
app.use('/api/*', (req, res) => res.status(404).json({ msg: `API ${req.method} ${req.originalUrl} not found.` }));
app.use('*', (req, res) => res.status(404).send(`Cannot ${req.method} ${req.originalUrl} (budget-api).`));
app.use((err, req, res, next) => { console.error("SERVER GLOBAL ERROR:", err.stack); res.status(500).json({ msg: 'Internal Server Error' }); });

app.listen(PORT, (err) => {
  if (err) { console.error(`SERVER ERROR: Failed to start on port ${PORT}:`, err); return; }
  console.log(`SERVER LOG: Express server (budget-api) listening on port ${PORT}`);
});
