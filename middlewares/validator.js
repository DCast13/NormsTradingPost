const { body, validationResult } = require('express-validator');
const validator = require('validator');

exports.validateId = (req, res, next) => {
    let id = req.params.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid id');
        err.status = 400;
        return next(err);
    } else {
        return next();
    }
};

exports.validateListing = [
    body('title').trim().notEmpty().withMessage('Title is required').customSanitizer(value => validator.stripLow(value, true)),
    body('condition').trim().isIn(['New', 'Like New', 'Very Good', 'Good', 'Other']).withMessage('Invalid condition'),
    body('price').trim().isCurrency({ allow_negatives: false }).withMessage('Invalid price'),
    body('details').trim().notEmpty().withMessage('Details are required').customSanitizer(value => validator.stripLow(value, true)),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let err = new Error('Validation failed');
            err.status = 400;
            err.errors = errors.array();
            return next(err);
        }
        next();
    }
];

exports.validateUser = [
    body('firstName').trim().notEmpty().withMessage('First name is required').escape(),
    body('lastName').trim().notEmpty().withMessage('Last name is required').escape(),
    body('email').trim().normalizeEmail().isEmail().withMessage('Invalid email address'),
    body('password').trim().isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let err = new Error('Validation failed');
            err.status = 400;
            err.errors = errors.array();
            return next(err);
        }
        next();
    }
];

exports.validateOffer = [
    body('amount').trim().isCurrency({ allow_negatives: false }).withMessage('Invalid offer amount'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let err = new Error('Validation failed');
            err.status = 400;
            err.errors = errors.array();
            return next(err);
        }
        next();
    }
];