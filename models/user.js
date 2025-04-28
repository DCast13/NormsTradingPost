const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

// Define the schema for a user
const userSchema = new Schema({
  username: { type: String },
  email: { type: String, required: [true, "email address is required"], unique: [true, "this email address has been used"] },
  password: { type: String, required: [true, "password is required"] },
  profilePicture: { type: String, default: "/assets/images/default-user.png" },
  firstName: { type: String },
  lastName: { type: String },
  bio: { type: String },
});

// Middleware to hash the password before saving the user
userSchema.pre("save", function (next) {
  let user = this;
  if (!user.username && user.email) {
    user.username = user.email.split("@")[0];
  }
  if (!user.isModified("password")) return next();
  bcrypt
    .hash(user.password, 10)
    .then((hash) => {
      user.password = hash;
      next();
    })
    .catch((err) => next(err));
});

// Method to compare input password with the hashed password in the database
userSchema.methods.comparePassword = function (inputPassword) {
  let user = this;
  return bcrypt.compare(inputPassword, user.password);
};

// Export the User model
module.exports = mongoose.model("User", userSchema);