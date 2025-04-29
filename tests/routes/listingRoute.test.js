const request = require("supertest");
const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});
const mongoose = require("mongoose");
const validObjectId = new mongoose.Types.ObjectId();

const Listing = require("../../models/listing");
const app = require("../../app");

describe("Listings Routes", () => {
  beforeEach(async () => {
    await request(app).post("/register").send({ email: "test@charlotte.edu", password: "password", repassword: "password" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should render the browse page with listings", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const mockListings = [
      { name: "Item 1", price: 10, description: "Description 1", image: "image1.jpg" },
      { name: "Item 2", price: 20, description: "Description 2", image: "image2.jpg" },
    ];

    sinon.stub(Listing, "find").returns({
      sort: sinon.stub().resolves(mockListings),
    });

    const response = await agent.get("/listings/browse");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Item 1");
    expect(response.text).to.include("Item 2");
  });

  it("should redirect to login if trying to access the sell page without authentication", async () => {
    const response = await request(app).get("/listings/sell");
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/login");
  });

  it("should render the sell page if authenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const response = await agent.get("/listings/sell");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Sell Item");
  });

  it("should render the details page for a specific listing", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const mockListing = {
      _id: validObjectId,
      name: "Item 1",
      price: 10,
      description: "Description 1",
      image: "image1.jpg",
      seller: { username: "JohnDoe", _id: "user-id" },
      category: "Other",
    };

    const populateStub = sinon.stub().resolves(mockListing);
    sinon.stub(Listing, "findById").returns({ populate: populateStub });

    const response = await agent.get(`/listings/details/${validObjectId}`);
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Item 1");
    expect(response.text).to.include("Description 1");
    //expect(response.text).to.include("JohnDoe");
  });

  it("should return 404 if listing is not found", async () => {
    agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const populateStub = sinon.stub().resolves(null);
    sinon.stub(Listing, "findById").returns({ populate: populateStub });

    const response = await agent.get("/listings/details/invalid-id");
    expect(response.status).to.equal(404);
    expect(response.text).to.include("Cannot find a listing with id: invalid-id");
  });

  it("should create a new listing when authenticated and allow deletion", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const createResponse = await agent
      .post("/listings")
      .field("name", "New Item")
      .field("condition", "New")
      .field("price", 50)
      .field("description", "A new item description")
      .field("category", "Other")
      .attach("image", Buffer.from("image content"), "test_image.jpg");

    expect(createResponse.status).to.equal(302);
    expect(createResponse.header.location).to.include("/listings/details/");

    const listingId = createResponse.header.location.split("/").pop();

    sinon.stub(Listing, "findOneAndDelete").callsFake(async (query) => {
      return Listing.findById(listingId); // Avoids pre of findOneAndDelete
    });

    const deleteResponse = await agent.delete(`/listings/${listingId}`);
    expect(deleteResponse.status).to.equal(302);
    expect(deleteResponse.header.location).to.equal("/listings/browse");
  });

  it("should return 403 if user is not the owner of the listing", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const mockListing = {
      _id: validObjectId,
      seller: "different-user-id",
    };

    sinon.stub(Listing, "findById").resolves(mockListing);

    const response = await agent.delete(`/listings/${validObjectId}`);
    expect(response.status).to.equal(403);
    expect(response.text).to.include("Unauthorized: You are not the owner of this listing.");
  });
});
