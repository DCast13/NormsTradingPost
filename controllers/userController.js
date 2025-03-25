const User = require("../models/user");

exports.create = async (req, res, next) => {
  const { email, password, repassword, firstName, lastName } = req.body;
  let user = new User({ email, password, firstName, lastName });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error_msg", "Email already in use");
      return res.redirect("/register");
    }

    if (password !== repassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/register");
    }

    await user.save();
    req.flash("success_msg", "User registered successfully");
    res.redirect("/login");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/register");
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const isMatch = await user.comparePassword(password);

    if (!user || !isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

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
