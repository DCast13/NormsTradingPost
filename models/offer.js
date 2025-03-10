const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    amount: {type: Number, required: [true, 'Amount is required'], min: 0.01},
    status: {type: String, required: true, enum: ['Pending', 'Accepted', 'Rejected']},
    seller: {type: Schema.Types.ObjectId, ref: 'User'},
    game: {type: Schema.Types.ObjectId, ref: 'Game'}
},
{timestamps: true}
);

module.exports = mongoose.model('Offer', offerSchema);