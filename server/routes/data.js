const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

// @route   GET api/data/export
// @desc    Export all data for the authenticated user
// @access  Private
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch all data associated with the user
        const budgets = await Budget.find({ userId }).lean();
        const expenses = await Expense.find({ userId }).lean();
        const income = await Income.find({ userId }).lean();

        // Helper function to remove database-specific fields before exporting
        const cleanData = (item) => {
            const { _id, userId, __v, createdAt, updatedAt, ...rest } = item;
            return rest;
        };

        const exportData = {
            budgets: budgets.map(cleanData),
            expenses: expenses.map(cleanData),
            income: income.map(cleanData),
        };

        res.json(exportData);
    } catch (err) {
        console.error("Export Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/data/import
// @desc    Import data for the authenticated user (this is a destructive action)
// @access  Private
router.post('/import', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { budgets, expenses, income } = req.body;

        // --- DESTRUCTIVE ACTION: Delete all existing data for this user ---
        await Budget.deleteMany({ userId });
        await Expense.deleteMany({ userId });
        await Income.deleteMany({ userId });

        // --- IMPORT NEW DATA ---
        // Add the user's ID back to each item before inserting it into the database
        if (budgets && Array.isArray(budgets) && budgets.length > 0) {
            await Budget.insertMany(budgets.map(b => ({ ...b, userId })));
        }
        if (expenses && Array.isArray(expenses) && expenses.length > 0) {
            await Expense.insertMany(expenses.map(e => ({ ...e, userId })));
        }
        if (income && Array.isArray(income) && income.length > 0) {
            await Income.insertMany(income.map(i => ({ ...i, userId })));
        }

        res.json({ msg: 'Data imported successfully.' });

    } catch (err) {
        console.error("Import Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
