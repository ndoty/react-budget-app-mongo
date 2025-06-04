// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (consider restricting in production)
app.use(express.json()); // To parse JSON request bodies, replaces bodyParser.json()

// --- MongoDB Connection ---
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
// It's generally better to use MONGO_URI directly from .env if possible
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${user}:${pass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('SERVER: MongoDB Connected Successfully!'))
.catch(err => {
    console.error('SERVER: MongoDB Connection Error:', err.message);
    // console.error('Full MongoDB Error details:', err); // Uncomment for more verbose DB errors
});

// --- Routes ---
console.log("SERVER: Attempting to mount /api/auth routes...");
const authRoutes = require('./routes/auth'); // Make sure this path is correct
app.use('/api/auth', authRoutes);
console.log("SERVER: /api/auth routes should be mounted now.");

// Test route at root of server (different from /ping to avoid confusion if client also has /ping)
app.get('/server-status', (req, res) => {
  console.log(`SERVER: /server-status route was hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server is alive and this route is directly on app.');
});

// Catch-all for API routes that are not found (should be after all other /api/... routes)
app.use('/api/*', (req, res) => {
    console.log(`SERVER: API 404. Handler for ${req.method} ${req.originalUrl} not found.`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// General 404 for any other unhandled routes
app.use('*', (req, res) => {
  console.log(`SERVER: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on server.`);
});


// --- Start Server ---
app.listen(PORT, (err) => {
  if (err) {
    console.error(`SERVER: Failed to start server on port ${PORT}:`, err);
    return;
  }
  console.log(`SERVER: Minimal server with auth routes is listening on port ${PORT}`);
  console.log(`SERVER: Try: curl http://localhost:${PORT}/server-status`);
  console.log(`SERVER: Try: curl http://localhost:${PORT}/api/auth/test-auth-route`);
  console.log(`SERVER: Try POSTing to: curl -X POST -H "Content-Type: application/json" -d '{"username":"test", "password":"pw"}' http://localhost:${PORT}/api/auth/register`);
});
