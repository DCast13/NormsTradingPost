const { body, validationResult } = require("express-validator");
const validator = require("validator");

// Middleware to check if the user is already authenticated
// Redirects to the browse page if the user is logged in
exports.checkAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/listings/browse");
  }
  next();
};

// Middleware to ensure the user is authenticated
// Redirects to the login page if the user is not logged in
exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  } else {
    req.flash("error_msg", "Please log in to view that resource");
    res.redirect("/user/login");
  }
};

// Middleware to validate listing data
exports.validateListing = [
  // Validate and sanitize the name field
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .customSanitizer((value) => validator.stripLow(value, true)),

  // Validate the condition field to ensure it matches allowed values
  body("condition")
    .trim()
    .isIn(["New", "Like New", "Very Good", "Good", "Other"])
    .withMessage("Invalid condition"),

  // Validate the price field to ensure it is a valid currency value
  body("price")
    .trim()
    .isCurrency({ allow_negatives: false })
    .withMessage("Invalid price"),

  // Validate and sanitize the description field
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .customSanitizer((value) => validator.stripLow(value, true)),

  // Middleware to handle validation errors
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

// Middleware to validate user data
exports.validateUser = [
  // Validate and normalize the email field
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((value) => {
      if (!value.endsWith("@charlotte.edu")) {
        throw new Error("Email must be a @charlotte.edu address");
      }
      return true;
    }),

  // Validate the password field to ensure it meets length requirements
  body("password")
    .trim()
    .isLength({ min: 4, max: 64 })
    .withMessage("Password must be between 4 and 64 characters"),

  // Middleware to handle validation errors
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

// Middleware to validate offer data
exports.validateOffer = [
  // Validate the amount field to ensure it is a valid currency value
  body("amount")
    .trim()
    .isCurrency({ allow_negatives: false })
    .withMessage("Invalid offer amount"),

  // Middleware to handle validation errors
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