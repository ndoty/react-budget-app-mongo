require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const http = require('http');
const WebSocket = require('ws');
const { version } = require('./package.json');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [ "https://budget.technickservices.com", "http://localhost:3000" ];
const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// MongoDB Connection using environment variables
const mongoConnectionString = process.env.MONGO_URI;
if (!mongoConnectionString) {
    console.error("FATAL ERROR: MONGO_URI is not defined.");
    process.exit(1);
}

mongoose.connect(mongoConnectionString)
  .then(() => console.log('SERVER LOG: MongoDB Connected Successfully!'))
  .catch(err => {
    console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message);
    process.exit(1);
  });

// WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

function broadcastDataUpdate(updateType) {
  const message = JSON.stringify({ type: updateType });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  console.log('✅ SERVER LOG: WebSocket client connected!');
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.send(JSON.stringify({ type: 'welcome', message: 'Successfully connected to backend WebSocket.' }));
  ws.on('close', () => console.log('SERVER LOG: WebSocket client disconnected.'));
  ws.on('error', (error) => console.error('SERVER LOG: WebSocket error:', error));
});

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const Income = require('./models/Income');

// Main API Routes
app.use('/api/auth', authRoutes);
app.get('/api/version', (req, res) => { res.status(200).json({ version: version }); });

// Budgets Routes
app.get("/api/budgets", authMiddleware, async (req, res) => { try { const budgets = await Budget.find({ userId: req.user.id }); res.status(200).json(budgets); } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.post("/api/budgets", authMiddleware, async (req, res) => { try { const newBudget = new Budget({ ...req.body, userId: req.user.id }); await newBudget.save(); broadcastDataUpdate('BUDGET_DATA_UPDATED'); res.status(201).json(newBudget); } catch (error) { console.error("POST /api/budgets Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.put("/api/budgets/:id", authMiddleware, async (req, res) => { try { const { name, max } = req.body; const updatedBudget = await Budget.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { name, max }, { new: true }); if (!updatedBudget) return res.status(404).json({ msg: "Budget not found" }); broadcastDataUpdate('BUDGET_DATA_UPDATED'); res.json(updatedBudget); } catch (error) { console.error("PUT /api/budgets/:id Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.delete("/api/budgets/:id", authMiddleware, async (req, res) => { try { await Budget.deleteOne({ id: req.params.id, userId: req.user.id }); await Expense.deleteMany({ budgetId: req.params.id, userId: req.user.id }); broadcastDataUpdate('BUDGET_DATA_UPDATED'); broadcastDataUpdate('EXPENSE_DATA_UPDATED'); res.status(200).json({ msg: "Budget deleted" }); } catch (error) { console.error("DELETE /api/budgets/:id Error:", error); res.status(500).json({ msg: "Server Error" }); } });

// Expenses Routes
app.get("/api/expenses", authMiddleware, async (req, res) => { try { const expenses = await Expense.find({ userId: req.user.id }).sort({ updatedAt: -1 }); res.status(200).json(expenses); } catch (error) { console.error("GET /api/expenses Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.post("/api/expenses", authMiddleware, async (req, res) => { try { const newExpense = new Expense({ ...req.body, userId: req.user.id }); await newExpense.save(); broadcastDataUpdate('EXPENSE_DATA_UPDATED'); res.status(201).json(newExpense); } catch (error) { console.error("POST /api/expenses Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.put("/api/expenses/:id", authMiddleware, async (req, res) => { try { const { description, amount, budgetId, isBill, dueDate } = req.body; const updatedExpense = await Expense.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { description, amount, budgetId, isBill: !!isBill, dueDate }, { new: true }); if (!updatedExpense) return res.status(404).json({ msg: "Expense not found" }); broadcastDataUpdate('EXPENSE_DATA_UPDATED'); res.json(updatedExpense); } catch (error) { console.error("PUT /api/expenses/:id Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.delete("/api/expenses/:id", authMiddleware, async (req, res) => { try { await Expense.deleteOne({ id: req.params.id, userId: req.user.id }); broadcastDataUpdate('EXPENSE_DATA_UPDATED'); res.status(200).json({ msg: "Expense deleted" }); } catch (error) { console.error("DELETE /api/expenses/:id Error:", error); res.status(500).json({ msg: "Server Error" }); } });

// Income Routes
app.get("/api/income", authMiddleware, async (req, res) => { try { const income = await Income.find({ userId: req.user.id }).sort({ date: -1 }); res.status(200).json(income); } catch (error) { console.error("GET /api/income Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.post("/api/income", authMiddleware, async (req, res) => { try { const newIncome = new Income({ ...req.body, userId: req.user.id }); await newIncome.save(); broadcastDataUpdate('INCOME_DATA_UPDATED'); res.status(201).json(newIncome); } catch (error) { console.error("POST /api/income Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.delete("/api/income/:id", authMiddleware, async (req, res) => { try { await Income.deleteOne({ id: req.params.id, userId: req.user.id }); broadcastDataUpdate('INCOME_DATA_UPDATED'); res.status(200).json({ msg: "Income deleted" }); } catch (error) { console.error("DELETE /api/income/:id Error:", error); res.status(500).json({ msg: "Server Error" }); } });
app.put("/api/income/:id", authMiddleware, async (req, res) => { try { const { description, amount } = req.body; const updatedIncome = await Income.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { description, amount }, { new: true }); if (!updatedIncome) return res.status(404).json({ msg: "Income not found" }); broadcastDataUpdate('INCOME_DATA_UPDATED'); res.json(updatedIncome); } catch (error) { console.error("PUT /api/income/:id Error:", error); res.status(500).json({ msg: "Server Error Updating Income" }); } });


server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
