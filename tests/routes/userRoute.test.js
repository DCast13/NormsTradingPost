const request = require("supertest");
const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const User = require("../../models/user");
const app = require("../../app");

describe("User Routes", () => {
  beforeEach(async () => {
    await request(app).post("/register").send({ email: "test@charlotte.edu", password: "password", repassword: "password" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should render the login page", async () => {
    const response = await request(app).get("/login");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Log In");
  });

  it("should redirect to profile after successful login", async () => {
    const mockUser = {
      _id: "123",
      email: "test@charlotte.edu",
      comparePassword: sinon.stub().resolves(true),
    };

    sinon.stub(User, "findOne").resolves(mockUser);

    const response = await request(app).post("/login").send({ email: "test@charlotte.edu", password: "password" });
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/listings/browse");
  });

  it("should render the registration page", async () => {
    const response = await request(app).get("/register");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Register");
  });

  it("should register a new user", async () => {
    sinon.stub(User, "findOne").resolves(null);
    sinon.stub(User.prototype, "save").resolves();

    const response = await request(app).post("/register").send({ email: "test@charlotte.edu", password: "password", repassword: "password" });

    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/listings/browse");
  });

  it("should render the profile page for an authenticated user", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const response = await agent.get("/profile/test");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("test");
  });

  it("should log out a user", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const response = await agent.get("/logout");
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/login");
  });

  it("should render the edit profile page for an authenticated user", async () => {
    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const response = await agent.get("/edit");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Edit Profile");
  });

  it("should update the user profile", async () => {
    const mockUser = {
      _id: "123",
      username: "testuser",
      save: sinon.stub().resolves(),
    };

    sinon.stub(User, "findById").resolves(mockUser);

    const agent = request.agent(app);
    await agent.post("/login").send({ email: "test@charlotte.edu", password: "password" });

    const response = await agent.post("/edit").send({ username: "newusername", firstName: "New", lastName: "Name", bio: "Updated bio" });

    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/profile/newusername");
  });
});
