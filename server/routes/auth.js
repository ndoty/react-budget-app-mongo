const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Import the auth middleware

// Function to read the JWT secret securely
function getJwtSecret() {
    const secretPath = '/run/secrets/jwt_secret';
    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf-8').trim();
    }
    return process.env.JWT_SECRET;
}

const JWT_SECRET = getJwtSecret();
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. The application cannot start.");
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

        const payload = {
            user: {
              id: user.id,
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                // Also return the username for display on the frontend
                res.json({ token, user: { username: user.username } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/auth/change-password
// @desc    Change user's password
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Find the user by the ID from the authenticated token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Save the user with the new password
        await user.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
