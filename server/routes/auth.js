const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Read the JWT_SECRET directly from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1); // Stop the application if the secret is missing
}

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ username, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
