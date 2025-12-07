const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.get('/profile', auth, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, name, email, address, role, store_id FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});


router.put(
    '/change-password',
    auth,
    [
        body('currentPassword').notEmpty(),
        body('newPassword')
            .isLength({ min: 8, max: 16 })
            .matches(/[A-Z]/)
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
    ],

    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { currentPassword, newPassword } = req.body;

            const users = await query(
                'SELECT password FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(currentPassword, users[0].password);

            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Incorrect current password' });
            }

            const newHash = await bcrypt.hash(newPassword, 10);

            await query(
                'UPDATE users SET password = ? WHERE id = ?',
                [newHash, req.user.id]
            );

            res.json({ success: true, message: 'Password updated successfully' });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating password',
                error: error.message
            });
        }
    }
);

module.exports = router;