const model = require('../models/listing');
const Offer = require('../models/offer');

// Get all active listings, optionally filtered by a search query
exports.getAllListings = (req, res, next) => {
    const search = req.query.search;
    console.log(search);

    const query = search ? {
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ],
        active: true
    } : { active: true };

    model.find(query)
        .sort({ price: 'asc' })
        .then(listings => res.render('./listings/browse', { listings }))
        .catch(err => next(err));
};

// Render the sell page
exports.sell = (req, res) => {
    res.render('./listings/sell');
};

// Create a new listing
exports.create = (req, res, next) => {
    let listing = new model(req.body);
    listing.seller = req.session.userId;
    if (req.file) {
        listing.image = '/assets/images/listings/' + req.file.filename;
    }
    listing.save()
        .then(listing => res.redirect('/listings/details/' + listing._id))
        .catch(err => {
            if (err.name === 'ValidationError') {
                err.status = 400;
                next(err);
            } else {
                next(err);
                console.log(listing);
            }
        });
};

// Get details of a specific listing by ID
exports.details = (req, res, next) => {
    let id = req.params.id;
    model.findById(id).populate('seller', 'firstName lastName')
        .then(listing => {
            if (listing) {
                res.render('./listings/details', { listing, user: req.session.userId });
            } else {
                let err = new Error('Cannot find a listing with id: ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

// Render the edit page for a specific listing
exports.edit = (req, res, next) => {
    let id = req.params.id;
    model.findById(id)
        .then(listing => {
            if (listing) {
                res.render('./listings/edit', { listing });
            } else {
                let err = new Error('Cannot find a listing with id: ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

// Update a specific listing by ID
exports.update = (req, res, next) => {
    let listing = req.body;
    let id = req.params.id;
    if (req.file) {
        listing.image = '/assets/images/listings/' + req.file.filename;
    }
    model.findByIdAndUpdate(id, listing, { useFindAndModify: false, runValidators: true })
        .then(listing => {
            if (listing) {
                res.redirect('/listings/details/' + id);
            } else {
                let err = new Error('Cannot find a listing with id: ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                err.status = 400;
            }
            next(err);
        });
};

// Delete a specific listing by ID
exports.delete = (req, res, next) => {
    let id = req.params.id;
    model.findOneAndDelete({ _id: id }, { useFindAndModify: false })
        .then(listing => {
            if (listing) {
                res.redirect('/listings/browse');
            } else {
                let err = new Error('Cannot find a listing with id: ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
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
        status: 'Pending',
        buyer: req.session.userId,
        listing: listingId
    });

    // Save the offer to the database
    offer.save()
        .then(() => {
            // Update the listing's totalOffers and highestOffer
            return model.findByIdAndUpdate(
                listingId,
                {
                    $inc: { totalOffers: 1 },
                    $max: { highestOffer: amount }
                },
                { useFindAndModify: false, new: true }
            );
        })
        .then(() => {
            res.redirect(`/listings/details/${listingId}`);
        })
        .catch(err => next(err));
};