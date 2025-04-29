let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const Offer = require("../../models/offer");

describe("Offer Model", () => {
  it("should throw validation error if required fields are missing", async () => {
    const offer = new Offer({});
    try {
      await offer.validate();
    } catch (err) {
      expect(err.errors.amount).to.exist;
      expect(err.errors.status).to.exist;
      expect(err.errors.buyer).to.exist;
      expect(err.errors.listing).to.exist;
    }
  });

  it("should throw validation error if amount is less than 0.01", async () => {
    const offer = new Offer({
      amount: 0,
      status: "Pending",
      buyer: "60d21b4667d0d8992e610c85",
      listing: "60d21b4967d0d8992e610c86",
    });
    try {
      await offer.validate();
    } catch (err) {
      expect(err.errors.amount).to.exist;
      expect(err.errors.amount.message).to.equal("Path `amount` (0) is less than minimum allowed value (0.01).");
    }
  });

  it("should throw validation error if status is invalid", async () => {
    const offer = new Offer({
      amount: 10,
      status: "InvalidStatus",
      buyer: "60d21b4667d0d8992e610c85",
      listing: "60d21b4967d0d8992e610c86",
    });
    try {
      await offer.validate();
    } catch (err) {
      expect(err.errors.status).to.exist;
      expect(err.errors.status.message).to.equal("`InvalidStatus` is not a valid enum value for path `status`.");
    }
  });

  it("should save a valid offer", async () => {
    const offer = new Offer({
      amount: 50,
      status: "Pending",
      buyer: "60d21b4667d0d8992e610c85",
      listing: "60d21b4967d0d8992e610c86",
    });

    const savedOffer = await offer.save();
    expect(savedOffer._id).to.exist;
    expect(savedOffer.amount).to.equal(50);
    expect(savedOffer.status).to.equal("Pending");
    expect(savedOffer.buyer.toString()).to.equal("60d21b4667d0d8992e610c85");
    expect(savedOffer.listing.toString()).to.equal("60d21b4967d0d8992e610c86");
  });

  it("should automatically add timestamps", async () => {
    const offer = new Offer({
      amount: 100,
      status: "Accepted",
      buyer: "60d21b4667d0d8992e610c85",
      listing: "60d21b4967d0d8992e610c86",
    });

    const savedOffer = await offer.save();
    expect(savedOffer.createdAt).to.exist;
    expect(savedOffer.updatedAt).to.exist;
  });
});
