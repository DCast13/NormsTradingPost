const User = require("../models/user");
const Listing = require("../models/listing");
const Offer = require("../models/offer");
const { deleteFile } = require("../middlewares/validator");

// Render the registration page
exports.getUserRegister = (req, res) => {
  res.render("user/register", { title: "Register" });
};

// Create a new user
exports.create = async (req, res, next) => {
  const { email, password, repassword, firstName, lastName } = req.body;
  let user = new User({ email, password, firstName, lastName });

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/register", {
        title: "Register",
        error_msg: "Email already in use",
        email: email,
      });
    }

    // Save the new user to the database
    await user.save();
    req.session.userId = user._id;
    req.flash("success_msg", "User registered successfully");
    res.redirect("/listings/browse");
  } catch (err) {
    return res.render("user/register", {
      title: "Register",
      error_msg: err.message,
      email: email,
    });
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
    // Check if email exists in the database
    const user = await User.findOne({ email });

    // If user not found or passwords don't match, return an error
    if (!user || !(await user.comparePassword(password))) {
      return res.render("user/login", {
        title: "Login",
        error_msg: "Invalid email or password",
        email: email,
      });
    }

    // Set the user ID in the session and redirect to the listings page
    req.session.userId = user._id;
    req.flash("success_msg", "Logged in successfully");
    res.redirect("/listings/browse");
  } catch (err) {
    return res.render("user/login", {
      title: "Login",
      error_msg: err.message,
      email: email,
    });
  }
};

// Render the user's profile page
exports.getUserProfile = async (req, res, next) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) {
    req.flash("error_msg", "User not found");
    return res.redirect("/browse");
  }

  let id = user._id;
  Promise.all([Listing.find({ seller: id }), Offer.find({ seller: id }).populate("listing", "name")])
    .then((results) => {
      const [listings, offers] = results;
      res.render("user/profile", { title: username, user, listings, offers });
    })
    .catch((err) => next(err));
};

// Log out a user
exports.logout = async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

// Render the edit profile page
exports.getUserEdit = (req, res) => {
  res.render("user/edit", { title: "Edit Profile" });
};

// Process the edit profile form submission
exports.edit = async (req, res, next) => {
  try {
    const { username, password, repassword, firstName, lastName, bio } = req.body;
    const userId = req.session.userId;

    // Find the user by ID to ensure they exist and to update their information
    let user = await User.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/login");
    }

    // Validate username uniqueness, excluding the current user
    if (await User.findOne({ username, _id: { $ne: userId } })) {
      return res.render("user/edit", {
        title: "Edit",
        error_msg: "Username already in use",
        firstName: firstName,
        lastName: lastName,
        bio: bio,
      });
    }

    // Handle password change if provided
    if (password) {
      user.password = password;
    }

    if (req.file) {
      // Delete the old profile picture if it's not the default image
      if (user.profilePicture && user.profilePicture !== "/assets/images/default-user.png") {
        await deleteFile(user.profilePicture);
      }

      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    // Update user fields with provided values
    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.bio = bio;

    await user.save();

    req.flash("success_msg", "Profile updated successfully");
    res.redirect(`/profile/${user.username}`);
  } catch (err) {
    next(err);
  }
};