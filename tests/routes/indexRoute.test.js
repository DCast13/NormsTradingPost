const request = require("supertest");
let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const app = require("../../app");

describe("Index Route", () => {
  it("should render the landing page", async () => {
    const response = await request(app).get("/");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Norm's Trading Post");
    expect(response.text).to.include("The place where anyone can find gold.");
    expect(response.text).to.include("Sign In");
    expect(response.text).to.include("Register");
  });

  it("should include the footer with social media links", async () => {
    const response = await request(app).get("/");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("fa-x-twitter");
    expect(response.text).to.include("fa-instagram");
    expect(response.text).to.include("fa-envelope");
    expect(response.text).to.include("fa-linkedin");
  });

  it("should include the banner image", async () => {
    const response = await request(app).get("/");
    expect(response.status).to.equal(200);
    expect(response.text).to.include('<img src="./assets/images/UNCC.png" alt="UNCC Campus" class="banner-image" />');
  });
});
