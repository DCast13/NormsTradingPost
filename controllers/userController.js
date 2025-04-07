const User = require("../models/user");
const Listing = require("../models/listing");

exports.create = async (req, res, next) => {
  const { email, password, repassword, firstName, lastName } = req.body;
  let user = new User({ email, password, firstName, lastName });

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error_msg", "Email already in use");
      return res.redirect("/register");
    }

    // Ensure password and repassword match
    if (password !== repassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/register");
    }

    // Save the new user to the database
    await user.save();
    req.session.userId = user._id;
    req.flash("success_msg", "User registered successfully");
    res.redirect("/browse");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/register");
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Check if email exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

    // Check if the password matches the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

    // Set the user session
    req.session.userId = user._id;
    req.flash("success_msg", "Logged in successfully");
    res.redirect("/browse");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/login");
  }
};

exports.logout = async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

exports.profile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/browse");
    }

    const listings = await Listing.find({ seller: user._id });

    res.render("user/profile", { user, currentUser: req.session.userId, listings });
  } catch (err) {
    next(err);
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { username, email, password, repassword, firstName, lastName, bio } = req.body;
    const userId = req.session.userId;

    // Ensure the user is logged in
    if (!userId) {
      req.flash("error_msg", "You must be logged in to edit your profile");
      return res.redirect("/login");
    }

    // Find the user by ID to ensure they exist and to update their information
    let user = await User.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/browse");
    }

    // Validate email and username uniqueness, excluding the current user
    if (await User.findOne({ email, _id: { $ne: userId } })) {
      req.flash("error_msg", "Email already in use");
      return res.redirect("/edit");
    }

    if (await User.findOne({ username, _id: { $ne: userId } })) {
      req.flash("error_msg", "Username already in use");
      return res.redirect("/edit");
    }

    // Handle password change if provided
    if (password || repassword) {
      if (password !== repassword) {
        req.flash("error_msg", "Passwords do not match");
        return res.redirect("/edit");
      }
      user.password = password;
    }

    if (req.file) {
      user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }

    // Update user fields with provided values
    user.username = username;
    user.email = email;
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
