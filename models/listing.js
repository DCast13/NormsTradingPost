const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a listing
const listingSchema = new Schema({
    title: {type: String, required: [true, 'Title is required']},
    seller: {type: Schema.Types.ObjectId, ref: 'User'},
    condition: {type: String, required: true, enum: ['New', 'Like New', 'Very Good', 'Good', 'Other']},
    price: {type: Number, required: [true, 'Price is required'], min: 0.01},
    details: {type: String, required: [true, 'Details are required'], minLength: [10, 'Details must be at least 10 characters']},
    image: {type: String, required: [true, 'Image is required']},
    active: {type: Boolean, default: true},
    totalOffers: {type: Number, default: 0},
    highestOffer: {type: Number, default: 0}
},
{timestamps: true} // Automatically add createdAt and updatedAt timestamps
);

// Middleware to delete related offers when a listing is deleted
listingSchema.pre('findOneAndDelete', function(next){
    const listingId = this.getQuery()['_id'];
    OffscreenCanvas.deleteMany({listing: listingId})
    .then(() => next())
    .catch(err => next(err));
});

// Export the Listing model
module.exports = mongoose.model('Listing', listingSchema);