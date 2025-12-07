const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { auth, isStoreOwner } = require('../middleware/auth');


router.get('/dashboard', auth, isStoreOwner, async (req, res) => {
    try {
        let storeId = req.user.storeId;

        if (!storeId) {
            const ownerStore = await query('SELECT id FROM stores WHERE owner_id = ?', [req.user.id]);
            if (ownerStore.length > 0) {
                storeId = ownerStore[0].id;
            }
        }

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store not access with this account'
            });
        }

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
  GROUP BY s.id
`, [storeId]);

        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        const ratingUsers = await query(`
  SELECT 
    u.id,
    u.name,
    u.email,
    r.rating,
    r.created_at
  FROM ratings r
  JOIN users u ON r.user_id = u.id
  WHERE r.store_id = ?
  ORDER BY r.created_at DESC
`, [storeId]);

        res.json({
            success: true,
            store: stores[0],
            ratingUsers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard',
            error: error.message
        });
    }
});
module.exports = router;

router.delete('/store', auth, isStoreOwner, async (req, res) => {
    try {
        let storeId = req.user.storeId;
        if (!storeId) {
            const ownerStore = await query('SELECT id FROM stores WHERE owner_id = ?', [req.user.id]);
            if (ownerStore.length > 0) storeId = ownerStore[0].id;
        }

        if (!storeId) return res.status(400).json({ success: false, message: 'Store not access with this account' });

        await query('DELETE FROM stores WHERE id = ?', [storeId]);
        res.json({ success: true, message: 'Store deleted' });
    } catch (error) {
        console.error('Owner delete store error:', error);
        res.status(500).json({ success: false, message: 'Error deleting store', error: error.message });
    }
});