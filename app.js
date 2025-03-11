const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const app = express();

// Configure app
let port = 3000;
let host = 'localhost';
app.set('view engine', 'ejs');
const mongUri = 'mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0'

// Connect to MongoDB
mongoose.connect(mongUri)
.then(() => {
    // Start server
    app.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    });
})
.catch(err =>console.log(err.mesage));

// Middleware for session handling
app.use(
  session({
      secret: "ajfeirf90aeu9eroejfoefj",
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({mongoUrl: 'mongodb://localhost:27017/normsTradingPost'}),
      cookie: {maxAge: 60*60*1000}
      })
);

// Middleware for flash messages
app.use(flash());

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("login", (req, res) => {
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

