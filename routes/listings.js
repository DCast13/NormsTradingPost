const express = require("express");
const router = express.Router();

router.get("/browse", (req, res) => {
  res.render("listings/browse");
});

router.get("/details", (req, res) => {
  res.render("listings/details");
});

router.get("/sell", (req, res) => {
  res.render("listings/sell");
});

module.exports = router;
