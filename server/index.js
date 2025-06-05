// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
// This should be the version that correctly handled API calls from your frontend.
const allowedOrigins = [
  "https://budget.technickservices.com", // HTTPS only as requested
  "http://localhost:3000"               // For local client development
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
const mongoConnectionString = process.env.MONGO_URI || `mongodb://<span class="math-inline">\{mongoUser\}\:</span>{mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

console.log(`SERVER LOG: Attempting to connect to MongoDB at: ${mongoConnectionString.replace(mongoPass || "YOUR_DB_PASS", "****")}`);
mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
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

app.post("/api/budgets
