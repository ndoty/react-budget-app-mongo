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
// ... (MongoDB connection logic remains the same)

// --- WebSocket Server Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

// --- MODIFIED: Added Diagnostic Logging ---
wss.on('connection', (ws, req) => {
  // This log proves that a connection request reached the backend.
  console.log('✅ SERVER LOG: WebSocket connection attempt received!');

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Send a welcome message to the client upon successful connection.
  ws.send(JSON.stringify({ type: 'welcome', message: 'Successfully connected to backend WebSocket.' }));

  ws.on('close', () => console.log('SERVER LOG: WebSocket client disconnected.'));
  ws.on('error', (error) => console.error('SERVER LOG: WebSocket error:', error));
});

// ... (Rest of your server/index.js file remains the same) ...
// --- ROUTES ---
// ... (All routes remain the same) ...

server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
