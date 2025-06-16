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

// MongoDB Connection
const mongoConnectionString = process.env.MONGO_URI;
// ... (MongoDB connection logic)

// --- WebSocket Server Setup ---
const server = http.createServer(app);
// ... (WebSocket setup logic)

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data'); // Import the new data routes
const authMiddleware = require('./middleware/authMiddleware');
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const Income = require('./models/Income');

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes); // Use the new data routes
app.get('/api/version', (req, res) => { res.status(200).json({ version: version }); });

// ... (Your other API routes for budgets, expenses, income)

server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
