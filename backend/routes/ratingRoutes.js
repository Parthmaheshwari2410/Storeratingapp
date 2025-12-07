const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');
const { validateRating, handleValidationErrors } = require('../middleware/validation');

router.post('/', auth, validateRating, handleValidationErrors, async (req, res) => {
    try {
        const { storeId, rating } = req.body;
        const userId = req.user.id;

        const stores = await query('SELECT id FROM stores WHERE id = ?', [storeId]);

        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        const existingRating = await query(
            'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
            [userId, storeId]
        );

        if (existingRating.length > 0) {

            await query(
                'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
                [rating, userId, storeId]
            );

            return res.json({
                success: true,
                message: 'Rating updated successfully'
            });
        } else {

            await query(
                'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
                [userId, storeId, rating]
            );

            return res.status(201).json({
                success: true,
                message: 'Rating submitted successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting rating',
            error: error.message
        });
    }
});

router.get('/my-ratings', auth, async (req, res) => {
    try {
        const ratings = await query(`
      SELECT 
        r.id,
        r.rating,
        r.created_at,
        s.id as store_id,
        s.name as store_name,
        s.address as store_address
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);

        res.json({
            success: true,
            ratings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ratings',
            error: error.message
        });
    }
});

module.exports = router;