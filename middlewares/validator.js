const { body, validationResult } = require("express-validator");
const validator = require("validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

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
    res.redirect("/login");
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
  body("condition").trim().isIn(["New", "Like New", "Very Good", "Good", "Other"]).withMessage("Invalid condition"),

  // Validate the price field to ensure it is a valid currency value
  body("price").trim().isCurrency({ allow_negatives: false }).withMessage("Invalid price"),

  // Validate and sanitize the description field
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .customSanitizer((value) => validator.stripLow(value, true)),

  // Middleware to handle validation errors
  // TODO: Render URLs are wrong because of the ?_method=PUT query string
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.render(`listings/details/${req.originalUrl.split("/").pop()}`, {
        title: "Listing Details",
        error_msg: errorMessages.join("\n"),
        name: req.body.name,
        condition: req.body.condition,
        price: req.body.price,
        description: req.body.description,
      });
    }
    if (req.fileValidationError) {
      return res.render(`listings/details/${req.originalUrl.split("/").pop()}`, {
        title: "Listing",
        error_msg: req.fileValidationError,
        name: req.body.name,
        condition: req.body.condition,
        price: req.body.price,
        description: req.body.description,
      });
    }
    next();
  },
];

// Middleware to validate offers
exports.validateOffer = [
  body("amount").trim().isCurrency({ allow_negatives: false }).withMessage("Invalid offer amount"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      const trimmedPath = req.originalUrl.split("/").pop();
      return res.render(`listings/details/${trimmedPath}`, {
        title: "Listing Details",
        error_msg: errorMessages.join("\n"),
        amount: req.body.amount,
      });
    }
    next();
  },
];

// Middleware to validate user data
exports.validateUser = [
  // Validate and normalize the email field
  body("email")
    .optional()
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
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value === "") {
        delete req.body.password; // Remove the password field from body if it's empty
        return true;
      }
      if (value.length < 8 || value.length > 64) {
        throw new Error("Password must be between 8 and 64 characters");
      }
      return true;
    }),
  body("repassword")
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value === "") {
        delete req.body.repassword; // Remove the repassword field from body if it's empty
        return true;
      }
      if (req.body.password && value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("username")
    .optional()
    .trim()
    .escape()
    .customSanitizer((value) => validator.stripLow(value, true))
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("firstName").optional().trim().escape(),
  body("lastName").optional().trim().escape(),
  body("bio")
    .optional()
    .trim()
    .escape()
    .customSanitizer((value) => validator.stripLow(value, true)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      const trimmedPath = req.originalUrl.split("/").pop();
      return res.render(`user/${trimmedPath}`, {
        title: trimmedPath.charAt(0).toUpperCase() + trimmedPath.slice(1),
        error_msg: errorMessages.join("\n"),
        email: req.body.email,
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        bio: req.body.bio,
      });
    }
    if (req.fileValidationError) {
      return res.render("user/edit", {
        title: "Edit Profile",
        error_msg: req.fileValidationError,
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        bio: req.body.bio,
      });
    }
    next();
  },
];

// Configure multer storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/profiles"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const listingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/listings"));
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
    req.fileValidationError = "Invalid file type. Only images are allowed.";
    cb(null, false); // Reject the file
  }
};

// Multer middleware
exports.uploadProfilePicture = multer({ storage: profileStorage, fileFilter });
exports.uploadListingPicture = multer({ storage: listingStorage, fileFilter });

// Utility function to delete a file
exports.deleteFile = async (filePath) => {
  try {
    const oldImagePath = path.join(__dirname, "../public", filePath);
    if (fs.existsSync(oldImagePath)) {
      await unlinkAsync(oldImagePath);
    } else {
      console.warn(`File not found: ${oldImagePath}`);
    }
  } catch (err) {
    throw err;
  }
};