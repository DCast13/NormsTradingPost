const express = require("express");
const morgan = require("morgan");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const userRoutes = require("./routes/userRoute");
const listingsRoutes = require("./routes/listingsRoute");

// Create app
const app = express();

// Configure app
let port = 3001;
let host = "localhost";
app.set("view engine", "ejs");
const mongUri = "mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    store: new MongoStore({ mongoUrl: mongUri }),
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// Middleware for flash messages
app.use(flash());

// Set global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.isAuthenticated = req.session.userId ? true : false;
  res.locals.currentPath = req.path;
  next();
});

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Middleware for logging HTTP requests
app.use(morgan('tiny'));

// Middleware to support HTTP verbs such as PUT and DELETE
app.use(methodOverride('_method'));

// Routes
app.get('/', (req, res) => {
  res.render('landing');
});

app.use('/listings', listingsRoutes);

app.use('/user', userRoutes);

// Middleware for handling 404 errors
app.use((req, res, next) => {
    let err = new Error('The server cannot locate ' + req.url);
    err.status = 404;
    next(err);
});

// Middleware for handling other errors
app.use((err, req, res, next) => {
    console.log(err.stack);
    if (!err.status) {
        err.status = 500;
        err.message = 'Internal Server Error';
    }
    res.status(err.status);
    res.render('error', { error: err });
});
