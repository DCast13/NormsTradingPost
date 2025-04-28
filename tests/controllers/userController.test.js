const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const User = require("../../models/user");
const userController = require("../../controllers/userController");

describe("userController", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should register a new user", async () => {
      const req = {
        body: { email: "test@charlotte.edu", password: "password", repassword: "password" },
        session: {},
        flash: sinon.spy(),
      };
      const res = { render: sinon.spy(), redirect: sinon.spy() };
      const next = sinon.spy();

      sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User.prototype, "save").resolves();

      await userController.create(req, res, next);

      expect(req.flash.calledWith("success_msg", "User registered successfully")).to.be.true;
      expect(res.redirect.calledWith("/listings/browse")).to.be.true;
      expect(req.session.userId).to.exist;
    });

    it("should handle duplicate email registration", async () => {
      const req = {
        body: { email: "test@charlotte.edu", password: "password", repassword: "password" },
        flash: sinon.spy(),
      };
      const res = { render: sinon.spy() };
      const next = sinon.spy();

      sinon.stub(User, "findOne").resolves({ email: "test@charlotte.edu" });

      await userController.create(req, res, next);

      expect(res.render.calledWith("user/register", sinon.match.has("error_msg", "Email already in use"))).to.be.true;
    });
  });

  describe("login", () => {
    it("should log in a user with valid credentials", async () => {
      const req = {
        body: { email: "test@charlotte.edu", password: "password" },
        session: {},
        flash: sinon.spy(),
      };
      const res = { render: sinon.spy(), redirect: sinon.spy() };
      const next = sinon.spy();

      const mockUser = {
        email: "test@charlotte.edu",
        comparePassword: sinon.stub().resolves(true),
        _id: "12345",
      };

      sinon.stub(User, "findOne").resolves(mockUser);

      await userController.login(req, res, next);

      expect(req.flash.calledWith("success_msg", "Logged in successfully")).to.be.true;
      expect(res.redirect.calledWith("/listings/browse")).to.be.true;
      expect(req.session.userId).to.equal("12345");
    });

    it("should handle invalid email or password", async () => {
      const req = {
        body: { email: "test@charlotte.edu", password: "wrongpassword" },
        flash: sinon.spy(),
      };
      const res = { render: sinon.spy() };
      const next = sinon.spy();

      const mockUser = {
        email: "test@charlotte.edu",
        comparePassword: sinon.stub().resolves(false),
      };

      sinon.stub(User, "findOne").resolves(mockUser);

      await userController.login(req, res, next);

      expect(res.render.calledWith("user/login", sinon.match.has("error_msg", "Invalid email or password"))).to.be.true;
    });

    it("should handle errors during login", async () => {
      const req = {
        body: { email: "test@charlotte.edu", password: "password" },
        flash: sinon.spy(),
      };
      const res = { render: sinon.spy() };
      const next = sinon.spy();

      sinon.stub(User, "findOne").throws(new Error("Database error"));

      await userController.login(req, res, next);

      expect(res.render.calledWith("user/login", sinon.match.has("error_msg", "Database error"))).to.be.true;
    });
  });

  describe("logout", () => {
    it("should log out a user", async () => {
      const req = {
        session: { destroy: sinon.stub().callsArg(0) },
      };
      const res = { redirect: sinon.spy() };
      const next = sinon.spy();

      await userController.logout(req, res, next);

      expect(res.redirect.calledWith("/login")).to.be.true;
    });

    it("should handle errors during logout", async () => {
      const req = {
        session: { destroy: sinon.stub().callsArgWith(0, new Error("Logout error")) },
      };
      const res = { redirect: sinon.spy() };
      const next = sinon.spy();

      await userController.logout(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has("message", "Logout error")))).to.be.true;
    });
  });
});
