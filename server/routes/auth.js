const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjusted path if necessary
require('dotenv').config();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username: username.toLowerCase(),
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in .env for registration token signing.");
      return res.status(201).json({ msg: 'User registered, but token generation failed. Please login.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
          console.error("JWT signing error during registration:", err);
          return res.status(201).json({ msg: 'User registered, but token generation error. Please login.' });
        }
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error("Registration server error:", err.message, err.stack);
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Username already exists.' });
    }
    res.status(500).json({ msg: 'Server error during registration process' });
  }
});

// @route   POST /api/auth/login
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
      return res.status(400).json({ msg: 'Invalid credentials (user not found)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials (password mismatch)' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };
    
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in .env for login token signing.");
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
        res.json({ token, userId: user.id, username: user.username });
      }
    );
  } catch (err) {
    console.error("Login server error:", err.message, err.stack);
    res.status(500).json({ msg: 'Server error during login process' });
  }
});

module.exports = router;
