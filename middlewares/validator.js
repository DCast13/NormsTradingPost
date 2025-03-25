const { body, validationResult } = require("express-validator");
const validator = require("validator");

exports.checkAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/browse");
  }
  next();
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  } else {
    req.flash("error_msg", "Please log in to view that resource");
    res.redirect("/login");
  }
};

exports.validateListing = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .customSanitizer((value) => validator.stripLow(value, true)),
  body("condition").trim().isIn(["New", "Like New", "Very Good", "Good", "Other"]).withMessage("Invalid condition"),
  body("price").trim().isCurrency({ allow_negatives: false }).withMessage("Invalid price"),
  body("details")
    .trim()
    .notEmpty()
    .withMessage("Details are required")
    .customSanitizer((value) => validator.stripLow(value, true)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let err = new Error("Validation failed");
      err.status = 400;
      err.errors = errors.array();
      return next(err);
    }
    next();
  },
];

exports.validateUser = [
  body("email").trim().normalizeEmail().isEmail().withMessage("Invalid email address"),
  body("password").trim().isLength({ min: 4, max: 64 }).withMessage("Password must be between 4 and 64 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      req.flash("error_msg", errorMessages.join(" "));
      return res.redirect(req.originalUrl);
    }
    next();
  },
];

exports.validateOffer = [
  body("amount").trim().isCurrency({ allow_negatives: false }).withMessage("Invalid offer amount"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let err = new Error("Validation failed");
      err.status = 400;
      err.errors = errors.array();
      return next(err);
    }
    next();
  },
];
