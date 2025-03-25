const express = require("express");
const { validateUser, ensureAuthenticated, checkAuthenticated } = require("../middlewares/validator");
const controller = require("../controllers/userController");
const User = require("../models/user");

const router = express.Router();

router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("user/profile");
});
router.get("/register", (req, res) => {
  res.render("user/register");
});
router.get("/login", checkAuthenticated, (req, res) => {
  res.render("user/login");
});

router.post("/register", validateUser, controller.create);
router.post("/login", validateUser, controller.login);
router.get("/logout", controller.logout);

module.exports = router;
