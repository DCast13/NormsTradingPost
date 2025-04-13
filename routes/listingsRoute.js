const express = require("express");
const controller = require("../controllers/listingsController");
const router = express.Router();
const { validateListing, ensureAuthenticated } = require("../middlewares/validator");
const upload = require('../middlewares/fileUpload');

// Browse all listings
router.get("/browse", ensureAuthenticated, controller.getAllListings);

// View details of a listing by id
router.get("/details/:id", ensureAuthenticated, controller.details);

// Sell page
router.get("/sell", ensureAuthenticated, controller.sell);

// Create a new listing
router.post("/", ensureAuthenticated, upload, validateListing, controller.create);

// Edit a listing
router.get("/edit/:id", ensureAuthenticated, controller.edit);

// Update a listing
router.put("/:id", ensureAuthenticated, upload, validateListing, controller.update);

module.exports = router;