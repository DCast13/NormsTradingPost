const { body, validationResult } = require("express-validator");
const validator = require("validator");
const multer = require("multer");
const path = require("path");


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

// MIddleware to validate offers
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
  body("password")
    .trim()
    .custom((value) => {
      if (value === "") {
        return true; // Skip further validation if the password is empty
      }
      return value.length >= 8 && value.length <= 64;
    })
    .withMessage("Password must be between 8 and 64 characters"),
  body("repassword").optional().trim().escape(),
  body("username").optional().trim().escape(),
  body("firstName").optional().trim().escape(),
  body("lastName").optional().trim().escape(),
  body("bio").optional().trim().escape(),
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

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/profile-pictures")); // Save files in this directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Multer middleware
exports.uploadProfilePicture = multer({ storage, fileFilter });

