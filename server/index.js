// server/index.js - TEST VERSION for /api/auth routing
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose"); // Keep for when we add back full auth routes

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MongoDB Connection (keep this, as auth routes will need it eventually) ---
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://${user}:${pass}@technickservices.com/React-Budget-App?authSource=admin`;

mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('SERVER: MongoDB Connected Successfully!'))
.catch(err => {
    console.error('SERVER: MongoDB Connection Error:', err.message);
});

// --- Direct Test Route for /api/auth ---
app.get('/api/auth/direct-test', (req, res) => {
    console.log("SERVER: GET /api/auth/direct-test route hit!");
    res.status(200).json({ message: "Direct /api/auth test route is working!" });
});

// --- Attempt to mount authRoutes (from file) ---
try {
    console.log("SERVER: Attempting to mount file-based /api/auth routes...");
    const authRoutes = require('./routes/auth'); // Path to your routes/auth.js
    app.use('/api/auth', authRoutes);
    console.log("SERVER: File-based /api/auth routes *should* be mounted.");
} catch (e) {
    console.error("SERVER: ERROR loading or using ./routes/auth.js:", e);
}


// --- Other Test Routes ---
app.get('/server-status', (req, res) => {
  console.log(`SERVER: /server-status route was hit at ${new Date().toISOString()}`);
  res.status(200).send('Backend server is alive (server-status).');
});

// Catch-all for API routes not found
app.use('/api/*', (req, res) => {
    console.log(`SERVER: API 404. Handler for ${req.method} ${req.originalUrl} not found.`);
    res.status(404).json({ msg: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// General 404 for any other unhandled routes
app.use('*', (req, res) => {
  console.log(`SERVER: General 404. Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}. Resource not found on server.`);
});


app.listen(PORT, (err) => {
  if (err) {
    console.error(`SERVER: Failed to start server on port ${PORT}:`, err);
    return;
  }
  console.log(`SERVER: Server is listening on port ${PORT}`);
  console.log(`SERVER: Try: curl http://localhost:${PORT}/server-status`);
  console.log(`SERVER: Try: curl http://localhost:${PORT}/api/auth/direct-test`);
  console.log(`SERVER: Try: curl http://localhost:${PORT}/api/auth/test-auth-route (from file)`);
});
