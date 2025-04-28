let chai;
let expect;

before(async () => {
  chai = await import("chai");
  expect = chai.expect;
});

const User = require("../../models/user");

describe("User Model", () => {
  it("should hash the password before saving", async () => {
    const user = new User({ email: "test@charlotte.edu", password: "password" });
    await user.save();
    expect(user.password).to.not.equal("password");
  });

  it("should validate email format", async () => {
    const user = new User({ email: "invalid-email", password: "password" });
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.email).to.exist;
      expect(err.errors.email.message).to.equal("email address is required");
    }
  });

  it("should throw validation error if email is missing", async () => {
    const user = new User({ password: "password" });
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.email).to.exist;
      expect(err.errors.email.message).to.equal("email address is required");
    }
  });

  it("should throw validation error if password is missing", async () => {
    const user = new User({ email: "test@charlotte.edu" });
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.password).to.exist;
      expect(err.errors.password.message).to.equal("password is required");
    }
  });

  it("should validate unique email addresses", async () => {
    const user1 = new User({ email: "test@charlotte.edu", password: "password" });
    const user2 = new User({ email: "test@charlotte.edu", password: "password" });

    await user1.save();
    try {
      await user2.save();
    } catch (err) {
      expect(err).to.exist;
      expect(err.message).to.equal("this email address has been used");
    }
  });

  it("should compare passwords correctly", async () => {
    const user = new User({ email: "test@charlotte.edu", password: "password" });
    await user.save();

    const isMatch = await user.comparePassword("password");
    expect(isMatch).to.be.true;

    const isNotMatch = await user.comparePassword("wrongpassword");
    expect(isNotMatch).to.be.false;
  });

  it("should set the username based on email if not provided", async () => {
    const user = new User({ email: "test@charlotte.edu", password: "password" });
    await user.save();
    expect(user.username).to.equal("test");
  });

  it("should not overwrite the username if it is provided", async () => {
    const user = new User({ email: "test@charlotte.edu", password: "password", username: "customUsername" });
    await user.save();
    expect(user.username).to.equal("customUsername");
  });

  it("should use the default profile picture if not provided", async () => {
    const user = new User({ email: "test@charlotte.edu", password: "password" });
    await user.save();
    expect(user.profilePicture).to.equal("/assets/images/default-user.png");
  });
});
