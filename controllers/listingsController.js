const model = require("../models/listing");

// Get all active listings, optionally filtered by a search query
exports.getAllListings = (req, res, next) => {
  const search = req.query?.search || "";
  const sort = req.query?.sort || "new";

  const query = search
    ? {
        $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
        active: true,
      }
    : { active: true };

  // Determine the sorting option
  let sortOption = {};
  switch (sort) {
    case "priceAsc":
      sortOption = { price: 1 }; // Ascending price
      break;
    case "priceDesc":
      sortOption = { price: -1 }; // Descending price
      break;
    case "old":
      sortOption = { createdAt: 1 }; // Oldest first
      break;
    default:
      sortOption = { createdAt: -1 }; // Newest first
  }

  // Category filtering
  const category = req.query.category; // Get category from query parameters
  if (category) {
    switch (category) {
      case "books":
        query.category = "Books"; // Filter for books
        break;
      case "dorm":
        query.category = "Dorm Essentials"; // Filter for dorm-related items
        break;
      case "electronics":
        query.category = "Electronics"; // Filter for electronics
        break;
      default:
        // No category filter applied
        break;
    }
  }

  // Fetch and sort listings
  model
    .find(query)
    .sort(sortOption)
    .then((listings) => res.render("./listings/browse", { listings, search, sort, category }))
    .catch((err) => next(err));
};

// Render the sell page
exports.sell = (req, res) => {
  res.render("./listings/sell");
};

// Create a new listing
exports.create = (req, res, next) => {
  let listing = new model(req.body);
  listing.seller = req.session.userId;
  if (req.file) {
    listing.image = "/assets/images/listings/" + req.file.filename;
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
  model
    .findById(id)
    .populate("seller", "firstName lastName")
    .then((listing) => {
      if (listing) {
        res.render("./listings/details", { listing, user: req.session.userId });
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
      if (listing) {
        res.render("./listings/edit", { listing });
      } else {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

// Update a specific listing by ID
exports.update = (req, res, next) => {
  let listing = req.body;
  let id = req.params.id;
  if (req.file) {
    listing.image = "/assets/images/listings/" + req.file.filename;
  }
  model
    .findByIdAndUpdate(id, listing, { useFindAndModify: false, runValidators: true })
    .then((listing) => {
      if (listing) {
        res.redirect("/listings/details/" + id);
      } else {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        next(err);
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
  model
    .findOneAndDelete({ _id: id }, { useFindAndModify: false })
    .then((listing) => {
      if (listing) {
        res.redirect("/listings/browse");
      } else {
        let err = new Error("Cannot find a listing with id: " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};
