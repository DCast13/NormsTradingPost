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

// Load environment variables if available
require('dotenv').config();

// Firebase Admin SDK initialization with error handling
let admin, db;
try {
  const serviceAccount = require("./firebase-service-account.json");
  admin = require("firebase-admin");
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://webapp-d140b-default-rtdb.firebaseio.com",
    storageBucket: "webapp-d140b.appspot.com",
  });

  db = admin.database();

  // Test Firebase connection
  db.ref("test")
    .set({ connected: true })
    .then(() => console.log("Firebase Realtime Database connected successfully"))
    .catch((error) => console.error("Firebase connection error:", error.message));
} catch (error) {
  console.error("Firebase initialization error:", error.message);
  console.log("Firebase features will be disabled");
  db = { ref: () => ({ set: () => Promise.resolve() }) }; // Mock db object
}

// Create app
const app = express();

// Configure app
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
app.set("view engine", "ejs");

// MongoDB connection URI - consider moving to environment variables
const mongUri = process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0";

// Middleware setup
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("tiny"));
app.use(methodOverride("_method"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ajfeirf90aeu9eroejfoefj",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongUri }),
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  })
);

// Flash messages
app.use(flash());

// Global variables middleware
const User = require("./models/user");
app.use(async (req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.currentPath = req.path;
  
  if (req.session.userId) {
    try {
      res.locals.globalUser = await User.findById(req.session.userId);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.locals.globalUser = null;
    }
  } else {
    res.locals.globalUser = null;
  }
  next();
});

// Connect to MongoDB
mongoose.connect(mongUri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  })
  .catch(err => console.error("MongoDB connection error:", err.message));

// Routes
app.get("/", (req, res) => {
  res.render("landing");
});

app.use("/listings", listingsRoutes);
app.use("/", userRoutes);

// Login route with improved error handling
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash("error_msg", "Email and password are required");
    return res.redirect("/login");
  }

  const sanitizedEmail = email.replace(/[.#$[\]]/g, "_");
  const loginAttemptRef = db.ref(`loginAttempts/${sanitizedEmail}`);

  loginAttemptRef.set({
    email,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  })
  .then(() => {
    req.session.userId = email;
    req.flash("success_msg", "Login successful!");
    res.redirect("/browse");
  })
  .catch(error => {
    console.error("Failed to log login attempt:", error.message);
    req.flash("error_msg", "Login failed!");
    res.redirect("/login");
  });
});

// Inbox route
app.get("/inbox", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to view your inbox.");
    return res.redirect("/login");
  }

  // Sample messages - replace with actual database logic
  const messages = [
    { sender: "user1@example.com", text: "Hello! Is the product still available?", timestamp: Date.now() - 60000 },
    { sender: "user2@example.com", text: "Can I get a discount?", timestamp: Date.now() - 3600000 },
  ];

  res.render("inbox", { title: "Inbox", user: req.session.userId, messages });
});

// Messages API endpoint
app.get("/messages/:email", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userEmail = req.session.userId.replace(/[.#$[\]]/g, "_");
  const conversationEmail = req.params.email.replace(/[.#$[\]]/g, "_");

  db.ref(`messages/${userEmail}`)
    .once("value")
    .then((snapshot) => {
      const allMessages = snapshot.val() || {};
      const filteredMessages = Object.values(allMessages).filter((message) => {
        return message.recipient === conversationEmail || message.sender === conversationEmail;
      });
      res.json(filteredMessages);
    })
    .catch((error) => {
      console.error("Error fetching messages:", error.message);
      res.status(500).json({ error: "Failed to load messages." });
    });
});

// Send message endpoint
app.post("/send-message", (req, res) => {
  const { recipient, message, recipientName } = req.body;

  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to send messages.");
    return res.redirect("/login");
  }

  const sanitizedSender = req.session.userId.replace(/[.#$[\]]/g, "_");
  const sanitizedRecipient = recipient.replace(/[.#$[\]]/g, "_");
  const timestamp = Date.now();

  const senderRef = db.ref(`messages/${sanitizedSender}/${timestamp}`);
  const recipientRef = db.ref(`messages/${sanitizedRecipient}/${timestamp}`);

  const senderData = {
    recipient,
    recipientName: recipientName || "Unknown Recipient",
    message,
    timestamp,
  };

  const recipientData = {
    sender: req.session.userId,
    message,
    timestamp,
  };

  Promise.all([senderRef.set(senderData), recipientRef.set(recipientData)])
    .then(() => {
      req.flash("success_msg", "Message sent successfully!");
      res.redirect("/inbox");
    })
    .catch(error => {
      console.error("Failed to save message:", error.message);
      req.flash("error_msg", "Failed to send the message.");
      res.redirect("/inbox");
    });
});

// Error handling middleware
app.use((req, res, next) => {
  const err = new Error("The server cannot locate " + req.url);
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.render("error", { 
    error: {
      status: err.status || 500,
      message: err.message || "Internal Server Error"
    } 
  });
});