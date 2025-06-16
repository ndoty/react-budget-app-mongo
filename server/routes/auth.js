const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User');
const Budget = require('../models/Budget'); // Import Budget model
const Expense = require('../models/Expense'); // Import Expense model
const Income = require('../models/Income'); // Import Income model
const authMiddleware = require('../middleware/authMiddleware');

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
              username: user.username
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
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
router.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/delete-account
// @desc    Delete user account and all associated data
// @access  Private
router.post('/delete-account', authMiddleware, async (req, res) => {
    const { password } = req.body;
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify the user's password before deletion
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect password. Account not deleted.' });
        }

        // Delete all associated data
        await Budget.deleteMany({ userId });
        await Expense.deleteMany({ userId });
        await Income.deleteMany({ userId });

        // Finally, delete the user account itself
        await User.findByIdAndDelete(userId);

        res.json({ msg: 'Account and all associated data have been permanently deleted.' });

    } catch (err) {
        console.error("Delete Account Error:", err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
