const express = require("express");
const controller = require("../controllers/userController");
const { validateUser, ensureAuthenticated, checkAuthenticated } = require("../middlewares/validator");

const router = express.Router();

// Render the registration page
router.get('/register', controller.register);

// Handle user registration
router.post('/', validateUser, controller.create);

// Render the login page
router.get('/login', checkAuthenticated, controller.getUserLogin);

// Handle user login
router.post('/login', checkAuthenticated, validateUser, controller.login);

// Render the user's profile page
router.get('/profile', ensureAuthenticated, controller.profile);

// Handle user logout
router.get('/logout', controller.logout);

module.exports = router;