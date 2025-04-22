const request = require("supertest");
const app = require("../../app");

describe("User Routes", () => {
  it("should render the login page", async () => {
    const response = await request(app).get("/login");
    expect(response.status).to.equal(200);
  });

  it("should redirect to profile after successful login", async () => {
    const response = await request(app).post("/login").send({ email: "test@charlotte.edu", password: "password" });
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/listings/browse");
  });
});
