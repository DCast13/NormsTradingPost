const model = require("../models/listing");

// Get all active listings, optionally filtered by a search query
exports.getAllListings = (req, res, next) => {
  const search = req.query?.search || "";
  const sort = req.query?.sort || "new";
  const category = req.query?.category || "";
  const minPrice = parseFloat(req.query?.minPrice) || 0;
  const maxPrice = parseFloat(req.query?.maxPrice) || Infinity;

  const query = {
    active: true,
    price: { $gte: minPrice, $lte: maxPrice },
  };

  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
  }

  if (category) {
    switch (category.toLowerCase()) {
      case "books":
        query.category = "Books";
        break;
      case "dorm":
        query.category = "Dorm Essentials";
        break;
      case "electronics":
        query.category = "Electronics";
        break;
      case "other":
        query.category = "Other";
        break;
    }
  }

  let sortOption = {};
  switch (sort) {
    case "priceAsc":
      sortOption = { price: 1 };
      break;
    case "priceDesc":
      sortOption = { price: -1 };
      break;
    case "old":
      sortOption = { createdAt: 1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  model
    .find(query)
    .sort(sortOption)
    .then((listings) =>
      res.render("./listings/browse", {
        listings,
        search,
        sort,
        category,
        minPrice: req.query?.minPrice || "",
        maxPrice: req.query?.maxPrice || "",
      })
    )
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
