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

wss.on('connection', (ws, req) => {
  console.log('✅ SERVER LOG: WebSocket client connected!');
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.send(JSON.stringify({ type: 'welcome', message: 'Successfully connected to backend WebSocket.' }));
  ws.on('close', () => console.log('SERVER LOG: WebSocket client disconnected.'));
  ws.on('error', (error) => console.error('SERVER LOG: WebSocket error:', error));
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
const dataRoutes = require('./routes/data');
const authMiddleware = require('./middleware/authMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.get('/api/version', (req, res) => { res.status(200).json({ version: version }); });

server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
