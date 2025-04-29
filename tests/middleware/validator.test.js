const sinon = require("sinon");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const { ensureAuthenticated, checkAuthenticated } = require("../../middlewares/validator");

describe("Middleware: ensureAuthenticated", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should call next if user is authenticated", () => {
    const req = { session: { userId: "123" } };
    const res = {};
    const next = sinon.spy();

    ensureAuthenticated(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.calledWith()).to.be.true;
  });

  it("should redirect to login if user is not authenticated", () => {
    const req = { session: {}, flash: sinon.spy() };
    const res = { redirect: sinon.spy() };
    const next = sinon.spy();

    ensureAuthenticated(req, res, next);

    expect(res.redirect.calledOnce).to.be.true;
    expect(res.redirect.calledWith("/login")).to.be.true;
    expect(req.flash.calledOnce).to.be.true;
    expect(req.flash.calledWith("error_msg", "Please log in to view that resource")).to.be.true;
    expect(next.called).to.be.false;
  });
});

describe("Middleware: checkAuthenticated", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to browse if user is already authenticated", () => {
    const req = { session: { userId: "123" } };
    const res = { redirect: sinon.spy() };
    const next = sinon.spy();

    checkAuthenticated(req, res, next);

    expect(res.redirect.calledOnce).to.be.true;
    expect(res.redirect.calledWith("/listings/browse")).to.be.true;
    expect(next.called).to.be.false;
  });

  it("should call next if user is not authenticated", () => {
    const req = { session: {} };
    const res = {};
    const next = sinon.spy();

    checkAuthenticated(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.calledWith()).to.be.true;
  });
});
