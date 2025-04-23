const { ensureAuthenticated } = require("../../middlewares/validator");

describe("Middleware: ensureAuthenticated", () => {
  it("should call next if user is authenticated", () => {
    const req = { session: { userId: "123" } };
    const res = {};
    const next = sinon.spy();

    ensureAuthenticated(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it("should redirect to login if user is not authenticated", () => {
    const req = { session: {} };
    const res = { redirect: sinon.spy(), flash: sinon.spy() };
    const next = sinon.spy();

    ensureAuthenticated(req, res, next);

    expect(res.redirect.calledWith("/login")).to.be.true;
  });
});
