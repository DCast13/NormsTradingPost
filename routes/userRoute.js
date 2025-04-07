const express = require("express");
const { validateUser, ensureAuthenticated, alreadyAuthenticated, uploadProfilePicture } = require("../middlewares/validator");
const controller = require("../controllers/userController");
const User = require("../models/user");

const router = express.Router();

router.get("/profile/:username", ensureAuthenticated, controller.profile);
router.get("/edit", ensureAuthenticated, (req, res) => {
  res.render("user/edit");
});
router.post("/edit", ensureAuthenticated, uploadProfilePicture.single("profilePicture"), validateUser, controller.edit);

router.get("/register", (req, res) => {
  res.render("user/register");
});
router.post("/register", validateUser, controller.create);

router.get("/login", alreadyAuthenticated, (req, res) => {
  res.render("user/login");
});
router.post("/login", controller.login);

router.get("/logout", controller.logout);

module.exports = router;
