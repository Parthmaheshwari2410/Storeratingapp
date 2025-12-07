const mysql = require('mysql');
const dotenv = require('dotenv');
const util = require('util');

dotenv.config();

let pool;
let rawQuery;

const DEFAULT_POOL_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_app',
    connectionLimit: 10,
    multipleStatements: true
};

function initPool(config = DEFAULT_POOL_CONFIG) {
    if (pool) {
        try {
            pool.end(() => { });
        } catch (e) {
        }
    }

    pool = mysql.createPool(config);
    rawQuery = util.promisify(pool.query).bind(pool);

    pool.on('error', (err) => {
        console.error('MySQL pool error:', err && err.code ? err.code : err);

        if (['PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED', 'ER_CON_COUNT_ERROR'].includes(err.code)) {
            console.log('Attempting to recreate MySQL pool after error...');
            setTimeout(() => initPool(config), 2000);
        }
    });

    pool.getConnection((err, connection) => {
        if (err) {
            console.error(' Database connection fail', err.message);
            return;
        }
        console.log('Database Connect Successfull');
        connection.release();
    });
}

initPool();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRecoverableError(err) {
    if (!err) return false;
    const recoverable = ['PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED', 'ER_CON_COUNT_ERROR', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'];
    return recoverable.includes(err.code) || /ECONNREFUSED/.test(err.message || '');
}

async function query(sql, params = []) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            return await rawQuery(sql, params);
        } catch (err) {
            attempt++;
            console.error(`DB query error (attempt ${attempt}):`, err && err.message ? err.message : err);
            if (isRecoverableError(err) && attempt < maxRetries) {
                try {
                    initPool();
                } catch (e) {
                    console.error('Error re-initializing pool:', e && e.message ? e.message : e);
                }
                await sleep(500 * attempt);
                continue;
            }
            throw err;
        }
    }
}

async function getConnection() {
    return new Promise((resolve, reject) => {
        if (!pool) return reject(new Error('Pool not initialized'));
        pool.getConnection((err, connection) => {
            if (err) return reject(err);

            connection.query = util.promisify(connection.query).bind(connection);
            connection.beginTransaction = util.promisify(connection.beginTransaction).bind(connection);
            connection.commit = util.promisify(connection.commit).bind(connection);
            connection.rollback = util.promisify(connection.rollback).bind(connection);
            resolve(connection);
        });
    });
}

const initDatabase = async () => {
    try {
        console.log('Initializing database..');

        await query(`
    CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(400),
    role ENUM('admin', 'user', 'store_owner') DEFAULT 'user',
    store_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
        console.log('Users table ready');

        await query(`
    CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(400),
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_owner (owner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
        console.log('Stores table ready');

        await query(`
    CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_store (user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_store (store_id),
    INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
        console.log('Ratings table ready');

        const adminExists = await query(
            'SELECT id FROM users WHERE email = ?',
            ['admin@admin.com']
        );

        if (adminExists.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Admin@123', 10);

            await query(
                'INSERT INTO users (name, email, password, role, address) VALUES (?, ?, ?, ?, ?)',
                ['System Administrator', 'admin@admin.com', hashedPassword, 'admin', 'System Address']
            );

            console.log('Default admin created');
            console.log('Email: admin@admin.com');
            console.log('Password: Admin@123');
        } else {
            console.log('Default admin already exists');
        }

        console.log('Database initialization complete');
    } catch (error) {
        console.error('Database initialization error', error);
    }
};

initDatabase();

module.exports = { query, getConnection };
