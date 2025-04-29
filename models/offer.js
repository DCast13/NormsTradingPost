const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for an offer
const offerSchema = new Schema(
  {
    amount: { type: Number, required: [true, "Amount is required"], min: 0.01 },
    status: { type: String, required: true, enum: ["Pending", "Accepted", "Rejected"] },
    buyer: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    listing: { type: Schema.Types.ObjectId, required: true, ref: "Listing" },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt timestamps
);

// Export the Offer model
module.exports = mongoose.model("Offer", offerSchema);
