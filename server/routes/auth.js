// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if your models folder is elsewhere, e.g., require('../models/User')
require('dotenv').config(); // Assumes .env is in the server/ directory, or use { path: '../.env' } if it's in project root

console.log("SERVER LOG: [server/routes/auth.js] File loaded, Express router instance created.");

// Test GET route to confirm this router is working
router.get('/test-auth-route', (req, res) => {
    console.log(`SERVER LOG: [server/routes/auth.js] GET /test-auth-route was hit at ${new Date().toISOString()}`);
    res.status(200).json({ message: "Auth router test GET route is successfully working!" });
});

// @route   POST /register (effectively /api/auth/register)
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  console.log(`SERVER LOG: [server/routes/auth.js] POST /register endpoint hit. Body:`, req.body ? JSON.stringify(req.body).substring(0,150) + "..." : "undefined/empty");
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("SERVER LOG: [server/routes/auth.js] Registration attempt failed: Username or password missing.");
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      console.log(`SERVER LOG: [server/routes/auth.js] Registration attempt failed: User "${username}" already exists.`);
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username: username.toLowerCase(),
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log(`SERVER LOG: [server/routes/auth.js] User "${username}" successfully registered and saved.`);

    const payload = { user: { id: user.id } };

    if (!process.env.JWT_SECRET) {
      console.error("SERVER ERROR: [server/routes/auth.js] JWT_SECRET is not defined in .env. Cannot sign token for registration.");
      // User created, but token gen failed. Client should ask user to login.
      return res.status(201).json({ msg: 'User registered, but server configuration issue (JWT_SECRET missing). Please try to login.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
          console.error("SERVER ERROR: [server/routes/auth.js] JWT signing error during registration:", err);
          return res.status(201).json({ msg: 'User registered, but error generating token. Please try to login.' });
        }
        console.log(`SERVER LOG: [server/routes/auth.js] Token generated for new user "${username}".`);
        res.status(201).json({ token }); // 201 Created for successful resource creation
      }
    );
  } catch (err) {
    console.error("SERVER ERROR: [server/routes/auth.js] Catch block in /register:", err.message, err.stack);
    if (err.code === 11000) { // MongoDB duplicate key error
        return res.status(400).json({ msg: 'Username already exists (database constraint).' });
    }
    res.status(500).json({ msg: 'Server error during registration process' });
  }
});

// @route   POST /login (effectively /api/auth/login)
router.post('/login', async (req, res) => {
  console.log(`SERVER LOG: [server/routes/auth.js] POST /login endpoint hit. Body:`, req.body ? JSON.stringify(req.body).substring(0,150) + "..." : "undefined/empty");
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("SERVER LOG: [server/routes/auth.js] Login attempt failed: Username or password missing.");
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.log(`SERVER LOG: [server/routes/auth.js] Login attempt failed: User "${username}" not found.`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`SERVER LOG: [server/routes/auth.js] Login attempt failed: Password mismatch for user "${username}".`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    
    if (!process.env.JWT_SECRET) {
      console.error("SERVER ERROR: [server/routes/auth.js] JWT_SECRET is not defined in .env. Cannot sign token for login.");
      return res.status(500).json({ msg: 'Server configuration error: Cannot generate token.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
            console.error("SERVER ERROR: [server/routes/auth.js] JWT signing error during login:", err);
            return res.status(500).json({msg: 'Error generating token during login'});
        }
        console.log(`SERVER LOG: [server/routes/auth.js] Token generated for user "${username}" on login.`);
        res.json({ token, userId: user.id, username: user.username }); // Send user info for client convenience
      }
    );
  } catch (err) {
    console.error("SERVER ERROR: [server/routes/auth.js] Catch block in /login:", err.message, err.stack);
    res.status(500).json({ msg: 'Server error during login process' });
  }
});

module.exports = router;
