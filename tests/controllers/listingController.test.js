const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const listingsController = require("../../controllers/listingsController.js");
const Listing = require("../../models/listing.js");

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
});
