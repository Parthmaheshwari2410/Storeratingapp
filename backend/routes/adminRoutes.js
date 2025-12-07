const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { auth, isAdmin } = require('../middleware/auth');
const {
    validateSignup,
    validateStore,
    handleValidationErrors
} = require('../middleware/validation');


router.get('/dashboard', auth, isAdmin, async (req, res) => {
    try {
        const userCount = await query('SELECT COUNT(*) AS count FROM users');
        const storeCount = await query('SELECT COUNT(*) AS count FROM stores');
        const ratingCount = await query('SELECT COUNT(*) AS count FROM ratings');

        res.json({
            success: true,
            stats: {
                totalUsers: userCount[0].count,
                totalStores: storeCount[0].count,
                totalRatings: ratingCount[0].count
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats'
        });
    }
});

router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const { search = '', role = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;

        let sql = `
            SELECT id, name, email, address, role, store_id, created_at
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (name LIKE ? OR email LIKE ? OR address LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (role) {
            sql += ` AND role = ?`;
            params.push(role);
        }

        const validSort = ['name', 'email', 'role', 'created_at'];
        const sortColumn = validSort.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${sortColumn} ${order}`;

        const users = await query(sql, params);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});


router.get('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const users = await query(
            `SELECT id, name, email, address, role, store_id, created_at FROM users WHERE id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let user = users[0];


        if (user.role === 'store_owner' && user.store_id) {
            const ratingData = await query(
                `SELECT COALESCE(AVG(rating), 0) AS average_rating FROM ratings WHERE store_id = ?`,
                [user.store_id]
            );
            user.storeRating = ratingData[0].average_rating;
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

router.post('/users', auth, isAdmin, validateSignup, handleValidationErrors, async (req, res) => {
    try {
        const { name, email, password, address = '', role = 'user' } = req.body;


        const existing = await query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO users (name, email, password, address, role)
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, address, role]
        );

        res.status(201).json({
            success: true,
            message: 'User added successfull',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding user',
            error: error.message
        });
    }
});

router.get('/stores', auth, isAdmin, async (req, res) => {
    try {
        const { search = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;

        let sql = `
            SELECT 
                s.id,
                s.name,
                s.email,
                s.address,
                s.created_at,
                COALESCE(AVG(r.rating), 0) AS average_rating,
                COUNT(r.id) AS total_ratings
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?)`;
            const sVal = `%${search}%`;
            params.push(sVal, sVal, sVal);
        }

        sql += ` GROUP BY s.id, s.name, s.email, s.address, s.created_at`;

        const validSort = ['name', 'email', 'average_rating', 'created_at'];
        const sortColumn = validSort.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${sortColumn} ${order}`;

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


router.post('/stores', auth, isAdmin, validateStore, handleValidationErrors, async (req, res) => {
    try {
        const { name, email, address = '', ownerEmail, ownerPassword } = req.body;

        if (!ownerEmail || !ownerPassword) {
            return res.status(400).json({
                success: false,
                message: 'Owner email and password are required'
            });
        }

        const storeExists = await query(
            `SELECT id FROM stores WHERE email = ?`,
            [email]
        );

        if (storeExists.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Store already exists with this email'
            });
        }

        const ownerExists = await query(
            `SELECT id FROM users WHERE email = ?`,
            [ownerEmail]
        );

        if (ownerExists.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Owner email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(ownerPassword, 10);

        const { getConnection } = require('../config/db');
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const maxAttempts = 3;
        let attempt = 0;
        let lastError;

        while (attempt < maxAttempts) {
            attempt++;
            const conn = await getConnection();
            try {
                console.log(`Attempt ${attempt}: starting transaction to create store and owner`);
                await conn.beginTransaction();

                const storeResult = await conn.query(
                    `INSERT INTO stores (name, email, address) VALUES (?, ?, ?)`,
                    [name, email, address]
                );
                const storeId = storeResult.insertId;

                const ownerResult = await conn.query(
                    `INSERT INTO users (name, email, password, address, role, store_id) VALUES (?, ?, ?, ?, ?, ?)`,
                    [name, ownerEmail, hashedPassword, address, 'store_owner', storeId]
                );

                await conn.query(`UPDATE stores SET owner_id = ? WHERE id = ?`, [ownerResult.insertId, storeId]);

                await conn.commit();
                conn.release();

                res.status(201).json({
                    success: true,
                    message: 'Store and owner added successfull',
                    storeId
                });
                return;
            } catch (err) {
                lastError = err;
                try { await conn.rollback(); } catch (e) { console.error('Rollback error:', e); }
                try { conn.release(); } catch (e) { }


                const code = err && err.code;
                if (code === 'ER_LOCK_WAIT_TIMEOUT' && attempt < maxAttempts) {
                    const backoff = 300 * attempt;
                    console.warn(`Lock wait timeout on attempt ${attempt}, retrying after ${backoff}ms`);
                    await sleep(backoff);
                    continue;
                }

                console.error('Add store error:', err);
                throw err;
            }
        }

        console.error('Add store fail after retries:', lastError);
        return res.status(500).json({ success: false, message: 'Error adding store', error: lastError && lastError.message });

    } catch (error) {
        console.error('Add store error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding store',
            error: error.message
        });
    }
});


router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
    }
});

router.delete('/stores/:id', auth, isAdmin, async (req, res) => {
    try {
        const storeId = req.params.id;
        await query('DELETE FROM stores WHERE id = ?', [storeId]);
        res.json({ success: true, message: 'Store deleted' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ success: false, message: 'Error deleting store', error: error.message });
    }
});

module.exports = router;

