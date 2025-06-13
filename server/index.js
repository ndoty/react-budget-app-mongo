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
  .catch(err => console.error('SERVER ERROR: MongoDB Connection Failed! Details:', err.message));

// WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });
// ... (WebSocket logic remains the same) ...

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
// ... (Your other require statements and routes remain the same) ...

app.use('/api/auth', authRoutes);
// ... (Your other app.use calls remain the same) ...

server.listen(PORT, () => {
  console.log(`SERVER LOG: Backend with WebSocket support is running on port ${PORT}`);
});
