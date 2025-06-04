// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Make sure cors is required
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com", // Your frontend production URL
  "http://budget.technickservices.com",  // If you also support HTTP for frontend (less common with HTTPS API)
  "http://localhost:3000"               // For local client development (if you still use it)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // OR if origin is in allowedOrigins list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin} because it's not in allowedOrigins.`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Explicitly list allowed methods
  allowedHeaders: "Content-Type, Authorization, X-Requested-With", // Explicitly list allowed headers
  credentials: true, // If you were using cookies/sessions (not strictly needed for JWT via Bearer token but good practice)
  optionsSuccessStatus: 204 // For preflight OPTIONS requests, respond with 204 No Content
};

// Use a global OPTIONS handler for preflight requests BEFORE your cors(corsOptions)
// This ensures OPTIONS requests get a quick 204 with CORS headers.
app.options('*', cors(corsOptions)); // Enable pre-flight across-the-board

app.use(cors(corsOptions)); // Apply your configured CORS options to all routes

app.use(express.json()); // To parse JSON request bodies

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://<span class="math-inline">\{mongoUser\}\:</span>{mongoPass}@technickservices.com/React-Budget-App?authSource=admin`;

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
const authRoutes = require('./routes/auth'); // Assuming path is correct
const authMiddleware = require('./middleware/authMiddleware'); // Assuming path is correct
const Budget = require("./models/Budget");
const Expense = require("./models/Expense");
const MonthlyCap = require('./models/MonthlyCap');


app.get('/server-status', (req, res) => {
  console.log(`SERVER LOG: GET /server-status route hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server (budget-api) is alive.');
});

try {
    console.log("SERVER LOG: Attempting to require and mount ./routes/auth ...");
    app.use('/api/auth', authRoutes);
    console.log("SERVER LOG: /api/auth routes *should* be mounted successfully.");
} catch (e) {
    console.error("SERVER ERROR: CRITICAL - Failed to load or use ./routes/auth.js! Details:", e);
}

// --- Protected Data API Routes ---
// (These should be the same as the last full backend server/index.js version
// where curl tests for your API were working. I'll include one as an example)
app.get("/api/budgets", authMiddleware, async (req, res) => {
  console.log(`SERVER LOG: GET /api/budgets for userId: ${req.userId}`);
  try {
    const budgets = await Budget.find({ userId: req.userId });
    console.log(`SERVER LOG: Found ${budgets.length} budgets for userId: ${req.userId}`);
    res.status(200).json(budgets);
  } catch (error) { console.error("GET /api/budgets Error:", error); res.status(500).json({ msg: "Server Error Fetching Budgets" }); }
});
// ... (Include all your other API routes for budgets, expenses, monthlyCap)
app.post("/api/budgets", authMiddleware, async (req, res) => {
