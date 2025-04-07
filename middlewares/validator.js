const { body, validationResult } = require("express-validator");
const validator = require("validator");
const multer = require("multer");
const path = require("path");

exports.alreadyAuthenticated = (req, res, next) => {
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
