
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

        const parts = authHeader.split(' ');
        const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admins only' });
    next();
};

const isStoreOwner = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const role = String(req.user.role || '').toLowerCase();
    const isOwner = role === 'store_owner' || role === 'storeowner' || role === 'store-owner' || role.includes('store');
    if (!isOwner) return res.status(403).json({ success: false, message: 'Store owners only' });
    next();
};

module.exports = {
    auth,
    isAdmin,
    isStoreOwner
};
