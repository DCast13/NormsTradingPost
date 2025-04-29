const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Offer = require("./offer"); // Correctly import the Offer model

// Define the schema for a listing
const listingSchema = new Schema(
  {
    name: { type: String, required: [true, "Title is required"] },
    seller: { type: Schema.Types.ObjectId, ref: "User" },
    condition: { type: String, required: true, enum: ["New", "Like New", "Very Good", "Good", "Other"] },
    price: { type: Number, required: [true, "Price is required"], min: 0.01 },
    description: { type: String, required: [true, "A description is required"], minLength: [10, "The description must be at least 10 characters"] },
    image: { type: String, required: [true, "Image is required"] },
    category: { type: String, required: true, enum: ["Books", "Dorm Essentials", "Electronics", "Other"] }, // New category field
    rating: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    totalOffers: { type: Number, default: 0 },
    highestOffer: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt timestamps
);

// Middleware to delete related offers when a listing is deleted
listingSchema.pre("findOneAndDelete", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const listingId = this.getQuery()["_id"];
    await Offer.deleteMany({ listing: listingId }).session(session);
    await session.commitTransaction();
    next();
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// Export the Listing model
module.exports = mongoose.model("Listing", listingSchema);
