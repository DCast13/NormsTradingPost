const User = require("../models/user");
const Listing = require("../models/listing");
const Offer = require("../models/offer");

exports.register = (req, res) => {
  res.render("user/register", { title: "Register" });
}

exports.create = async (req, res, next) => {
  const { email, password, repassword, firstName, lastName } = req.body;
  let user = new User({ email, password, firstName, lastName });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error_msg", "Email already in use");
      return res.redirect("/user/register");
    }

    if (password !== repassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/user/register");
    }

    await user.save();
    req.flash("success_msg", "User registered successfully");
    res.redirect("/user/login");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/user/register");
  }
};

exports.getUserLogin = (req, res) => {
  res.render("user/login", { title: "Login" });
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/user/login");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/user/login");
    }

    req.session.userId = user._id;
    req.flash("success_msg", "Logged in successfully");
    res.redirect("/listings/browse");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/user/login");
  }
};

exports.profile = (req, res, next)=>{
  let id = req.session.user;
  Promise.all([model.findById(id), Game.find({seller: id}), Offer.find({seller: id}).populate('game', 'title')])
  .then(results=>{
      const [user, games, offers] = results;
      res.render('./user/profile', {user, games, offers});
  })
  .catch(err=>next(err));
};

exports.logout = async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/user/login");
  });
};
