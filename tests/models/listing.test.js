let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const Listing = require("../../models/listing");

describe("Listing Model", () => {
  it("should throw validation error if required fields are missing", async () => {
    const listing = new Listing({});
    try {
      await listing.validate();
    } catch (err) {
      expect(err.errors.name).to.exist;
      expect(err.errors.condition).to.exist;
      expect(err.errors.price).to.exist;
      expect(err.errors.description).to.exist;
      expect(err.errors.image).to.exist;
    }
  });

  it("should throw validation error if description is too short", async () => {
    const listing = new Listing({
      name: "Test Item",
      condition: "New",
      price: 10.99,
      description: "Short",
      image: "test.jpg",
      category: "Other",
    });
    try {
      await listing.validate();
    } catch (err) {
      expect(err.errors.description).to.exist;
      expect(err.errors.description.message).to.equal("The description must be at least 10 characters");
    }
  });

  it("should save a valid listing", async () => {
    const listing = new Listing({
      name: "Test Item",
      condition: "New",
      price: 10.99,
      description: "A test item description",
      image: "test.jpg",
      category: "Other",
    });

    const savedListing = await listing.save();
    expect(savedListing._id).to.exist;
    expect(savedListing.name).to.equal("Test Item");
    expect(savedListing.condition).to.equal("New");
    expect(savedListing.price).to.equal(10.99);
    expect(savedListing.description).to.equal("A test item description");
    expect(savedListing.image).to.equal("test.jpg");
    expect(savedListing.active).to.be.true;
    expect(savedListing.totalOffers).to.equal(0);
    expect(savedListing.highestOffer).to.equal(0);
  });

  it("should default active to true if not provided", async () => {
    const listing = new Listing({
      name: "Test Item",
      condition: "New",
      price: 10.99,
      description: "A test item description",
      image: "test.jpg",
      category: "Other",
    });

    const savedListing = await listing.save();
    expect(savedListing.active).to.be.true;
  });

  it("should throw validation error if price is less than 0.01", async () => {
    const listing = new Listing({
      name: "Test Item",
      condition: "New",
      price: 0,
      description: "A test item description",
      image: "test.jpg",
      category: "Other",
    });
    try {
      await listing.validate();
    } catch (err) {
      expect(err.message).to.equal("Listing validation failed: price: Path `price` (0) is less than minimum allowed value (0.01).");
    }
  });

  it("should throw validation error if condition is invalid", async () => {
    const listing = new Listing({
      name: "Test Item",
      condition: "Invalid Condition",
      price: 10.99,
      description: "A test item description",
      image: "test.jpg",
      category: "Other",
    });
    try {
      await listing.validate();
    } catch (err) {
      expect(err.errors.condition).to.exist;
      expect(err.errors.condition.message).to.equal("`Invalid Condition` is not a valid enum value for path `condition`.");
    }
  });
});
