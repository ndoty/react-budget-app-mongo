const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const User = require('../models/User');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const authMiddleware = require('../middleware/authMiddleware');

// Read credentials directly from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

if (!JWT_SECRET || !MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error("One or more required environment variables are not set. The application cannot start.");
}

// Mailgun transport using environment variables
const mailgunAuth = {
  auth: {
    api_key: MAILGUN_API_KEY,
    domain: MAILGUN_DOMAIN
  }
};

const nodemailerMailgun = nodemailer.createTransport(mg(mailgunAuth));

// Email validation regex
const isEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    // --- Validation block ---
    if (!isEmail(username)) {
        return res.status(400).json({ msg: 'Please use a valid email address as your username.' });
    }
    // --- End validation block ---

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

// @route   POST api/auth/update-username
// @desc    Update a user's username to a valid email
// @access  Private
router.post('/update-username', authMiddleware, async (req, res) => {
    const { newUsername } = req.body;
    const userId = req.user.id;

    if (!isEmail(newUsername)) {
        return res.status(400).json({ msg: 'Please provide a valid email address.' });
    }

    try {
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(400).json({ msg: 'This email is already in use by another account.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        user.username = newUsername;
        await user.save();

        // Create a new token with the updated username
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
                // Send back the new user object and token
                res.json({ token, user: { username: user.username }, msg: 'Username updated successfully.' });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
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

// @route   POST api/auth/forgot-password
// @desc    Forgot password
router.post('/forgot-password', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetURL = `https://budget.technickservices.com/reset-password/${token}`;

        const mailOptions = {
            from: 'admin@technickservices.com',
            to: user.username,
            subject: 'Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                  `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                  `${resetURL}\n\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        nodemailerMailgun.sendMail(mailOptions, (err, data) => {
            if (err) {
                console.error('Error sending email:', err);
            }
            res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
        });
    } catch (err)       {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ msg: 'Your password has been successfully reset.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/delete-account
// @desc    Delete user account and all associated data
router.post('/delete-account', authMiddleware, async (req, res) => {
    const { password } = req.body;
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect password. Account not deleted.' });
        }

        await Budget.deleteMany({ userId });
        await Expense.deleteMany({ userId });
        await Income.deleteMany({ userId });
        await User.findByIdAndDelete(userId);

        res.json({ msg: 'Your account and all associated data have been permanently deleted.' });

    } catch (err) {
        console.error("Delete Account Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;