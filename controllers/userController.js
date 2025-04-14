const User = require("../models/user");
const Listing = require("../models/listing");
const Offer = require("../models/offer");

// Render the registration page
exports.register = (req, res) => {
  res.render("user/register", { title: "Register" });
};

// Create a new user
exports.create = async (req, res, next) => {
  const { email, password, repassword, firstName, lastName } = req.body;
  let user = new User({ email, password, firstName, lastName });

  try {
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error_msg", "Email already in use");
      return res.redirect("/user/register");
    }

    // Ensure passwords match
    if (password !== repassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/user/register");
    }

    // Save the new user
    await user.save();
    req.flash("success_msg", "User registered successfully");
    res.redirect("/user/login");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/user/register");
  }
};

// Render the login page
exports.getUserLogin = (req, res) => {
  res.render("user/login", { title: "Login" });
};

// Log in a user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, return an error
    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/user/login");
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await user.comparePassword(password);

    // If passwords do not match, return an error
    if (!isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/user/login");
    }

    // Set the user ID in the session and redirect to the listings page
    req.session.userId = user._id;
    req.flash("success_msg", "Logged in successfully");
    res.redirect("/listings/browse");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/user/login");
  }
};

// Render the user's profile page
exports.profile = (req, res, next) => {
  let id = req.session.user;
  Promise.all([
    model.findById(id), 
    Listing.find({ seller: id }), 
    Offer.find({ seller: id }).populate('listing', 'name')
  ])
  .then(results => {
    const [user, listings, offers] = results;
    res.render('./user/profile', { user, listings, offers });
  })
  .catch(err => next(err));
};

// Log out a user
exports.logout = async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/user/login");
  });
};