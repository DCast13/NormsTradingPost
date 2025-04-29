const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const listingsController = require("../../controllers/listingsController.js");
const Listing = require("../../models/listing.js");
const Offer = require("../../models/offer.js");

describe("listingsController", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getAllListings", () => {
    it("should fetch all active listings", async () => {
      const req = { query: {} };
      const res = { render: sinon.spy() };
      const next = sinon.spy();

      const mockListings = [
        { name: "Item 1", price: 10 },
        { name: "Item 2", price: 20 },
      ];
      sinon.stub(Listing, "find").returns({
        sort: sinon.stub().resolves(mockListings),
      });

      await listingsController.getAllListings(req, res, next);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.calledWith("./listings/browse", { title: "Browse", listings: mockListings })).to.be.true;
      expect(next.called).to.be.false;
    });

    it("should fetch listings filtered by search query", async () => {
      const req = { query: { search: "Item" } };
      const res = { render: sinon.spy() };
      const next = sinon.spy();

      const mockListings = [
        { name: "Item 1", price: 10 },
        { name: "Item 2", price: 20 },
      ];
      sinon
        .stub(Listing, "find")
        .withArgs({
          $or: [{ name: { $regex: "Item", $options: "i" } }, { description: { $regex: "Item", $options: "i" } }],
          active: true,
        })
        .returns({
          sort: sinon.stub().resolves(mockListings),
        });

      await listingsController.getAllListings(req, res, next);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.calledWith("./listings/browse", { title: "Browse", listings: mockListings })).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe("reactivateListing", () => {
    it("should reactivate a listing if the user is the seller", async () => {
      const req = {
        params: { id: "listing-id" },
        session: { userId: "seller-id" },
        flash: sinon.spy(),
      };
      const res = { redirect: sinon.spy() };
      const next = sinon.spy();

      const mockListing = {
        _id: "listing-id",
        seller: "seller-id",
        save: sinon.stub().resolves(),
      };

      sinon.stub(Listing, "findById").resolves(mockListing);

      await listingsController.reactivateListing(req, res, next);

      expect(mockListing.active).to.be.true;
      expect(mockListing.save.calledOnce).to.be.true;
      expect(req.flash.calledWith("success_msg", "Listing reactivated successfully")).to.be.true;
      expect(res.redirect.calledWith("/listings/details/listing-id")).to.be.true;
    });
  });

  describe("acceptOffer", () => {
    it("should accept an offer and reject others for the same listing", async () => {
      const req = {
        params: { id: "offer-id" },
        session: { userId: "seller-id" },
        flash: sinon.spy(),
      };
      const res = { redirect: sinon.spy() };
      const next = sinon.spy();

      const mockOffer = {
        _id: "offer-id",
        active: true,
        listing: { _id: "listing-id", seller: "seller-id" },
        status: "Pending",
        save: sinon.stub().resolves(),
      };

      const populateStub = sinon.stub().resolves(mockOffer);
      sinon.stub(Offer, "findById").returns({ populate: populateStub });
      sinon.stub(Listing, "findByIdAndUpdate").resolves();
      sinon.stub(Offer, "updateMany").resolves();

      await listingsController.acceptOffer(req, res, next);

      expect(mockOffer.status).to.equal("Accepted");
      expect(mockOffer.save.calledOnce).to.be.true;
      expect(Offer.updateMany.calledWith({ listing: "listing-id", _id: { $ne: "offer-id" } }, { status: "Rejected" })).to.be.true;
      expect(req.flash.calledWith("success_msg", "Offer accepted successfully")).to.be.true;
      expect(res.redirect.calledWith("/listings/details/listing-id")).to.be.true;
    });
  });

  describe("createOffer", () => {
    it("should create a new offer and update the listing's highest offer", async () => {
      const req = {
        params: { id: "listing-id" },
        body: { amount: 100 },
        session: { userId: "buyer-id" },
      };
      const res = { redirect: sinon.spy() };
      const next = sinon.spy();

      const mockListing = {
        _id: "listing-id",
        active: true,
      };

      sinon.stub(Listing, "findById").resolves(mockListing);
      sinon.stub(Offer.prototype, "save").resolves();
      sinon.stub(Listing, "findByIdAndUpdate").resolves();

      await listingsController.createOffer(req, res, next);

      expect(Offer.prototype.save.calledOnce).to.be.true;
      expect(Listing.findByIdAndUpdate.calledWith("listing-id", { $inc: { totalOffers: 1 }, $max: { highestOffer: 100 } })).to.be.true;
      expect(res.redirect.calledWith("/listings/details/listing-id")).to.be.true;
    });
  });
});
