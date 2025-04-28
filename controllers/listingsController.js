const mongoose = require("mongoose");
const model = require("../models/listing");
const Offer = require("../models/offer");
const { deleteFile } = require("../middlewares/validator");
const { title } = require("process");

// Get all active listings, optionally filtered by a search query
exports.getAllListings = (req, res, next) => {
  const search = req.query.search;

  const query = search
    ? {
        $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
        active: true,
      }
    : { active: true };

  model
    .find(query)
    .sort({ price: "asc" })
    .then((listings) => res.render("./listings/browse", { title: "Browse", listings }))
    .catch((err) => next(err));
};

// Render the sell page
exports.sell = (req, res) => {
  res.render("./listings/sell", { title: "Post Listing" });
};

// Create a new listing
exports.create = (req, res, next) => {
  let listing = new model(req.body);
  listing.seller = req.session.userId;
  if (req.file) {
    listing.image = "/uploads/listings/" + req.file.filename;
  }
  listing
    .save()
    .then((listing) => res.redirect("/listings/details/" + listing._id))
    .catch((err) => {
      if (err.name === "ValidationError") {
        err.status = 400;
        next(err);
      } else {
        next(err);
      }
    });
};

// Get details of a specific listing by ID
exports.details = (req, res, next) => {
  let id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    let err = new Error("Cannot find a listing with id: " + id);
    err.status = 404;
    return next(err);
  }

  model
    .findById(id)
    .populate("seller", "firstName lastName")
    .then((listing) => {
      if (listing) {
        res.render("./listings/details", { title: listing.name, listing });
      } else {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

// Render the edit page for a specific listing
exports.edit = (req, res, next) => {
  let id = req.params.id;
  model
    .findById(id)
    .then((listing) => {
      if (!listing) {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        return next(err);
      }

      // Check if the logged-in user is the owner of the listing
      if (listing.seller.toString() !== req.session.userId) {
        let err = new Error("Unauthorized: You are not the owner of this listing.");
        err.status = 403;
        return next(err);
      }

      res.render("./listings/edit", { title: "Edit Listing", listing });
    })
    .catch((err) => next(err));
};

// Update a specific listing by ID
exports.update = (req, res, next) => {
  let updatedListing = req.body;
  let id = req.params.id;

  model
    .findById(id)
    .then((listing) => {
      if (!listing) {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        return next(err);
      }

      // If a new file is uploaded, delete the old image
      if (req.file) {
        deleteFile(listing.image);
        updatedListing.image = "/uploads/listings/" + req.file.filename;
      }

      // Update the listing
      return model.findByIdAndUpdate(id, updatedListing, {
        useFindAndModify: false,
        runValidators: true,
      });
    })
    .then((updatedListing) => {
      if (updatedListing) {
        res.redirect("/listings/details/" + id);
      }
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        err.status = 400;
      }
      next(err);
    });
};

// Delete a specific listing by ID
exports.delete = (req, res, next) => {
  let id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    let err = new Error("Id is not valid: " + id);
    err.status = 500;
    return next(err);
  }

  model
    .findById(id)
    .then((listing) => {
      if (!listing) {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        return next(err);
      }

      // Check if the logged-in user is the owner of the listing
      if (listing.seller.toString() !== req.session.userId) {
        console.log("Seller ID: ", listing.seller.toString(), " is not User ID: ", req.session.userId);
        let err = new Error("Unauthorized: You are not the owner of this listing.");
        err.status = 403;
        return next(err);
      }

      return model.findOneAndDelete({ _id: id }, { useFindAndModify: false });
    })
    .then((listing) => {
      if (listing) {
        deleteFile(listing.image);
        res.redirect("/listings/browse");
      }
    })
    .catch((err) => next(err));
};

// Create an offer for a specific listing by ID
exports.createOffer = (req, res, next) => {
  const listingId = req.params.id;
  const { amount } = req.body;

  // Validate the offer amount
  if (!amount || amount <= 0) {
    const err = new Error("Invalid offer amount");
    err.status = 400;
    return next(err);
  }

  // Create a new offer
  const offer = new Offer({
    amount,
    status: "Pending",
    buyer: req.session.userId,
    listing: listingId,
  });

  // Save the offer to the database
  offer
    .save()
    .then(() => {
      // Update the listing's totalOffers and highestOffer
      return model.findByIdAndUpdate(
        listingId,
        {
          $inc: { totalOffers: 1 },
          $max: { highestOffer: amount },
        },
        { useFindAndModify: false, new: true }
      );
    })
    .then(() => {
      res.redirect(`/listings/details/${listingId}`);
    })
    .catch((err) => next(err));
};
