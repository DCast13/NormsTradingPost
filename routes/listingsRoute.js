const express = require("express");
const controller = require("../controllers/listingsController");
const router = express.Router();
const { validateListing, ensureAuthenticated } = require("../middlewares/validator");
const upload = require('./fileUpload');

// Route to browse all listings
router.get("/browse", ensureAuthenticated, controller.getAllListings);

// Route to view details of a specific listing
router.get("/details/:id", ensureAuthenticated, controller.details);

// Route to render the sell page
router.get("/sell", ensureAuthenticated, controller.sell);

// Route to create a new listing
router.post("/", ensureAuthenticated, upload, validateListing, controller.create);

// Route to edit a listing
router.get("/edit/:id", ensureAuthenticated, controller.edit);

// Route to update a listing
router.post("/edit/:id", ensureAuthenticated, upload, validateListing, controller.update);

module.exports = router;