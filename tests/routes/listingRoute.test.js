const request = require("supertest");
const app = require("../../app"); // Assuming app.js exports the Express app

describe("Listings Routes", () => {
  it("should render the browse page", async () => {
    const response = await request(app).get("/listings/browse");
    expect(response.status).to.equal(200);
  });

  it("should redirect to login if not authenticated", async () => {
    const response = await request(app).get("/listings/sell");
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal("/login");
  });
});
