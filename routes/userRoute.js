const express = require("express");
const controller = require("../controllers/userController");
const { validateUser, ensureAuthenticated, checkAuthenticated, uploadProfilePicture } = require("../middlewares/validator");

const router = express.Router();

// Render profile page
router.get("/profile/:username", ensureAuthenticated, controller.getUserProfile);

// Handle modifying users
router.get("/edit", ensureAuthenticated, controller.getUserEdit);
router.post("/edit", ensureAuthenticated, uploadProfilePicture.single("profilePicture"), validateUser, controller.edit);

// Render the registration page
router.get("/register", controller.getUserRegister);

// Handle user registration
router.post("/register", validateUser, controller.create);

// Render the login page
router.get("/login", checkAuthenticated, controller.getUserLogin);

// Handle user login
router.post("/login", checkAuthenticated, validateUser, controller.login);

// Handle user logout
router.get("/logout", controller.logout);

module.exports = router;
