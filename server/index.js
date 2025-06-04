// server/index.js - MINIMAL TEST VERSION
require('dotenv').config(); // For PORT from .env
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON (good to keep for future API routes)
app.use(express.json());

// Simplest possible GET route
app.get('/ping', (req, res) => {
  console.log(`SERVER: /ping route was hit at ${new Date().toISOString()}`);
  res.status(200).send('pong from minimal backend');
});

// A simple root route for further testing
app.get('/', (req, res) => {
    console.log(`SERVER: / (root) route was hit at ${new Date().toISOString()}`);
    res.status(200).send('Minimal Express server is alive!');
});

// Catch-all for any other routes to see if they are even reaching here
app.use((req, res, next) => {
  console.log(`SERVER: 404 Handler - Path not found: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl} - Route not handled by minimal server.`);
});

// Error handling middleware (very basic)
app.use((err, req, res, next) => {
  console.error("SERVER: Unhandled error occurred:", err.stack);
  res.status(500).send('Something broke on the server!');
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(`SERVER: Failed to start server on port ${PORT}:`, err);
    return;
  }
  console.log(`Minimal server is listening on port ${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/ping`);
  console.log(`Try: curl http://localhost:${PORT}/`);
});
