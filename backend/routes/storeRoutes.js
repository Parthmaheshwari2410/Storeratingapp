const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');


router.get('/', async (req, res) => {
    try {
        const { search = '' } = req.query;

        let sql = `
      SELECT 
        s.id,
        s.name,
        s.email,
        s.address,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings,
        (SELECT rating FROM ratings WHERE user_id = ? AND store_id = s.id) as user_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;


        const userId = req.user ? req.user.id : null;
        let params = [userId];

        if (search) {
            sql += ' AND (s.name LIKE ? OR s.address LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        sql += ' GROUP BY s.id, s.name, s.email, s.address ORDER BY s.name ASC';

        const stores = await query(sql, params);

        res.json({
            success: true,
            stores
        });
    } catch (error) {
        console.error('Fetch stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stores',
            error: error.message
        });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const storeId = req.params.id;

        const stores = await query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.address,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.email, s.address
    `, [storeId]);

        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        const userId = req.user ? req.user.id : null;
        const userRating = await query(
            'SELECT rating FROM ratings WHERE user_id = ? AND store_id = ?',
            [userId, storeId]
        );

        res.json({
            success: true,
            store: stores[0],
            userRating: userRating.length > 0 ? userRating[0].rating : null
        });
    } catch (error) {
        console.error('Fetch store error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store details',
            error: error.message
        });
    }
});

module.exports = router;