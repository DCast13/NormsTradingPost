const express = require("express");
const controller = require("../controllers/listingsController");
const router = express.Router();
const { validateListing, ensureAuthenticated, uploadListingPicture } = require("../middlewares/validator");

// Browse all listings
router.get("/browse", ensureAuthenticated, controller.getAllListings);

// View details of a listing by id
router.get("/details/:id", ensureAuthenticated, controller.details);

// Sell page
router.get("/sell", ensureAuthenticated, controller.sell);

// Sort listings
router.get("/", async (req, res) => {
  const sort = req.query.sort || "new";
  const listings = await getAllListings(sort);
  res.render("listings/browse", { listings, sort });
});

// Create a new listing
router.post("/", ensureAuthenticated, uploadListingPicture.single("image"), validateListing, controller.create);

// Edit a listing
router.get("/edit/:id", ensureAuthenticated, controller.edit);

// Update a listing
router.put("/:id", ensureAuthenticated, uploadListingPicture.single("image"), validateListing, controller.update);

// Delete a listing
router.delete("/:id", ensureAuthenticated, controller.delete);

// Create an offer for a listing
router.post("/offers/:id", ensureAuthenticated, controller.createOffer);

// Accept an offer for a listing
router.post("/offers/:id/accept", ensureAuthenticated, controller.acceptOffer);

// Reactivate a listing
router.post("/:id/reactivate", ensureAuthenticated, controller.reactivateListing);

module.exports = router;
