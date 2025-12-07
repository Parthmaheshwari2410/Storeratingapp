const { body, validationResult } = require('express-validator');

const validateSignup = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage('Name must be between 3 and 60 characters'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .isLength({ min: 8, max: 16 })
        .withMessage('Password must be between 8 and 16 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character'),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 400 })
        .withMessage('Address must not exceed 400 characters')
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateStore = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage('Store name must be between 3 and 60 characters'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email'),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 400 })
        .withMessage('Address must not exceed 400 characters'),

    body('ownerEmail')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid owner email'),

    body('ownerPassword')
        .isLength({ min: 8, max: 16 })
        .withMessage('Owner password must be between 8 and 16 characters')
        .matches(/[A-Z]/)
        .withMessage('Owner password must contain at least one uppercase letter')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Owner password must contain at least one special character')
];

const validateRating = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    body('storeId')
        .isInt()
        .withMessage('Store ID must be a valid number')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateStore,
    validateRating,
    handleValidationErrors
};