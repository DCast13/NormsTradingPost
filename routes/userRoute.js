const express = require("express");
const controller = require("../controllers/userController");
const { validateUser, ensureAuthenticated, checkAuthenticated } = require("../middlewares/validator");

const router = express.Router();

router.get('/register', controller.register);
router.post('/', validateUser, controller.create);
router.get('/login', checkAuthenticated, controller.getUserLogin);
router.post('/login', checkAuthenticated, validateUser, controller.login);
router.get('/profile', ensureAuthenticated, controller.profile);
router.get('/logout', controller.logout);

module.exports = router;
