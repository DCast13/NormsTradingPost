const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/browse", (req, res) => {
  res.render("browse");
});

app.get("/details", (req, res) => {
  res.render("details");
});

app.get("/sell", (req, res) => {
  res.render("sell");
});

app.get("/profile", (req, res) => {
  res.render("profile");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
