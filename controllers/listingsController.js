const model = require('../models/listing');

exports.getAllListings = (req, res, next) => {
    const search = req.query.search;
    console.log(search);

    const query = search ? {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { details: { $regex: search, $options: 'i' } }
        ],
        active: true
    } : {active: true};

    model.find(query)
    .sort({ price: 'asc' })
    .then(listings => res.render('./listings/browse', { listings }))
    .catch(err => next(err));
};

exports.sell = (req, res) => {
    res.render('./listings/sell');
};

exports.create = (req, res, next) => {
    let listing = new model(req.body);
    listing.seller = req.session.userId;
    if (req.file) {
        listing.image = '/images/listings/' + req.file.filename;
    }
    listing.save()
    .then(listing => res.redirect('/listings/details/' + listing._id))
    .catch(err => {
        if (err.name === 'ValidationError') {
            err.status = 400;
            next(err);
        } else {
            next(err);
        }
    });
};

exports.details = (req, res, next) => {
    let id = req.params.id;
    model.findById(id).populate('seller', 'firstName lastName')
    .then(listing => {
        if (listing) {
            res.render('./listings/details', { listing });
        } else {
            let err = new Error('Cannot find a listing with id: ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};

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

exports.update = (req, res, next) => {
    let listing = req.body;
    let id = req.params.id;
    if (req.file) {
        listing.image = '/images/listings/' + req.file.filename;
    }
    model.findByIdAndUpdate(id, listing, {useFindAndModify: false, runValidators: true})
    .then(listing=> {
        if (listing) {
            res.redirect('/listings/' + id);
        } else {
            let err = new Error('Cannot find a listing with id: ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err=> {
        if (err.name === 'ValidationError') {
            err.status = 400;
        }
        next(err);
    });
};

exports.delete = (req, res, next) => {
    let id = req.params.id;
    model.findOneAndDelete({_id: id}, {useFindAndModify: false})
    .then(game=> {
        if (game) {
            res.redirect('/games');
        } else {
            let err = new Error('Cannot find a game with id: ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};