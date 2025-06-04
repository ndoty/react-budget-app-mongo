const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure correct path to User model
require('dotenv').config();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ username: username.toLowerCase() }); // Check with consistent casing
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username: username.toLowerCase(), // Store in consistent casing
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id, // Mongoose virtual getter for _id
      },
    };

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in .env for the server.");
      // Do not send token if JWT_SECRET is missing; user has to log in later.
      // Or, decide if registration should fail entirely. For now, we'll complete user creation.
      return res.status(201).json({ msg: 'User registered, but token generation failed due to server config. Please login.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) {
          console.error("JWT signing error during registration:", err);
          // User is created, but token failed. Client should probably try to login.
          return res.status(201).json({ msg: 'User registered, but token generation failed. Please login.' });
        }
        res.status(201).json({ token }); // Successfully created user and token
      }
    );
  } catch (err) {
    console.error("Registration server error:", err.message, err.stack);
    if (err.code === 11000) { // Duplicate key error from MongoDB
        return res.status(400).json({ msg: 'Username already exists.' });
    }
    res.status(500).json({ msg: 'Server error during registration process' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };
    
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in .env for the server during login.");
      return res.status(500).json({ msg: 'Server configuration error: Cannot generate token.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
            console.error("JWT signing error during login:", err);
            return res.status(500).json({msg: 'Error generating token during login'});
        }
        // Send back userId and username along with token for client convenience
        res.json({ token, userId: user.id, username: user.username });
      }
    );
  } catch (err) {
    console.error("Login server error:", err.message, err.stack);
    res.status(500).json({ msg: 'Server error during login process' });
  }
});

module.exports = router;
