const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/validator");

router.get("/browse", ensureAuthenticated, (req, res) => {
  res.render("listings/browse");
});

router.get("/details", ensureAuthenticated, (req, res) => {
  res.render("listings/details");
});

router.get("/sell", ensureAuthenticated, (req, res) => {
  res.render("listings/sell");
});

module.exports = router;
