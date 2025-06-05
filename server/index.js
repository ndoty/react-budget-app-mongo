// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const http = require('http'); // Added
const WebSocket = require('ws'); // Added

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
  "https://budget.technickservices.com",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`SERVER CORS: Request received. Origin header: ${origin}`);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`SERVER CORS: Origin ${origin} is ALLOWED.`);
      callback(null, true);
    } else {
      console.warn(`SERVER CORS: Origin <span class="math-inline">\{origin\} is BLOCKED\. Not in allowed list\: \[</span>{allowedOrigins.join(', ')}]`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204
};

// General request logging middleware
app.use((req, res, next) => {
  console.log(`SERVER INCOMING REQUEST: Method: ${req.method}, Path: ${req.path}, Origin: ${req.headers.origin}`);
  next();
});

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// --- MongoDB Connection ---
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoConnectionString = process.env.MONGO_URI || `mongodb://<span class="math-inline">\{mongoUser\}\:</span>{mongoPass}@technickservices.com/React-Budget-App
