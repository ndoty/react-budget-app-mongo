// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

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
    const payload = { user: { id: user.id } };
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: 'Server configuration error: JWT_SECRET missing.' });
    }
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
          return res.status(500).json({ msg: 'Error generating token during registration.' });
        }
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Username already exists (database constraint).' });
    }
    res.status(500).json({ msg: 'Server error during registration process' });
  }
});

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
    const payload = { user: { id: user.id } };
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: 'Server configuration error: Cannot generate token.' });
    }
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
            return res.status(500).json({msg: 'Error generating token during login'});
        }
        res.json({ token, userId: user.id, username: user.username });
      }
    );
  } catch (err) {
    res.status(500).json({ msg: 'Server error during login process' });
  }
});

module.exports = router;
