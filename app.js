const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const app = express();

// Configure app
let port = 3000;
let host = "localhost";
app.set("view engine", "ejs");
const mongUri = "mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose
  .connect(mongUri)
  .then(() => {
    // Start server
    app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  })
  .catch((err) => console.log(err.mesage));

// Middleware for session handling
app.use(
  session({
    secret: "ajfeirf90aeu9eroejfoefj",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: "mongodb://localhost:27017/normsTradingPost" }),
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// Middleware for flash messages
app.use(flash());

const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/user");
const listingsRoutes = require("./routes/listings");

app.set("views", path.join(__dirname, "views"));

app.locals.basedir = app.get("views/partials");

app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRoutes);
app.use("/", userRoutes);
app.use("/", listingsRoutes);
