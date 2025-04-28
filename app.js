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

// Firebase Admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://webapp-d140b-default-rtdb.firebaseio.com",
  storageBucket: "webapp-d140b.appspot.com",
});

const db = admin.database();

// Test Firebase connection
db.ref("test")
  .set({ connected: true })
  .then(() => console.log("Firebase connected successfully"))
  .catch(error => console.error(" Firebase connection failed:", error.message));

// Create app
const app = express();

// Configure app
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
app.set("view engine", "ejs");
const mongUri = "mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0";

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("tiny"));
app.use(methodOverride("_method"));

// Session configuration
app.use(
  session({
    secret: "ajfeirf90aeu9eroejfoefj",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongUri }),
    cookie: { maxAge: 60 * 60 * 1000 },
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
  res.locals.isAuthenticated = req.session.userId ? true : false;
  
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
    app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  })
  .catch(err => console.error("MongoDB connection error:", err.message));

// Routes
app.get("/", (req, res) => {
  res.render("landing");
});

// Browse items route
app.get("/browse", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to access this page.");
    return res.redirect("/login");
  }

  const sellItemsRef = db.ref("sellItems");

  sellItemsRef.once("value")
    .then((snapshot) => {
      const allItems = snapshot.val() || {};
      const productList = [];

      Object.keys(allItems).forEach((userKey) => {
        const userItems = allItems[userKey];
        if (userItems) {
          productList.push(...Object.values(userItems));
        }
      });

      res.render("listings/browse", {
        title: "Browse Items",
        user: req.session.userId,
        products: productList,
      });
    })
    .catch((error) => {
      console.error("Error fetching items:", error.message);
      req.flash("error_msg", "Failed to load items.");
      res.redirect("/");
    });
});

// Product details route
app.get("/details", (req, res) => {
  const productId = req.query.id;

  if (!productId) {
    req.flash("error_msg", "Product not found.");
    return res.redirect("/browse");
  }

  const sellItemsRef = db.ref("sellItems");

  sellItemsRef.once("value")
    .then((snapshot) => {
      const allItems = snapshot.val() || {};
      let product = null;

      Object.keys(allItems).forEach((userKey) => {
        const userItems = allItems[userKey];
        if (userItems) {
          const item = Object.values(userItems).find(item => item.id === productId);
          if (item) product = item;
        }
      });

      if (!product) {
        req.flash("error_msg", "Product not found.");
        return res.redirect("/browse");
      }

      res.render("listings/details", { 
        title: "Product Details",
        product,
        user: req.session.userId 
      });
    })
    .catch(error => {
      console.error("Error fetching product:", error.message);
      req.flash("error_msg", "Failed to load product details.");
      res.redirect("/browse");
    });
});

// Inbox route
app.get("/listings/inbox", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to view your inbox.");
    return res.redirect("/login");
  }

  // Get unique conversation partners
  const userEmail = req.session.userId.replace(/[.#$[\]]/g, "_");
  const messagesRef = db.ref(`messages/${userEmail}`);

  messagesRef.once("value")
    .then((snapshot) => {
      const messages = snapshot.val() || {};
      const conversations = {};

      // Organize messages by conversation partner
      Object.values(messages).forEach(msg => {
        const partner = msg.recipient || msg.sender;
        if (partner) {
          conversations[partner] = true;
        }
      });

      res.render("inbox", {
        title: "Inbox",
        user: req.session.userId,
        messages: Object.keys(conversations)
      });
    })
    .catch(error => {
      console.error("Error loading inbox:", error.message);
      req.flash("error_msg", "Failed to load inbox.");
      res.redirect("/");
    });
});

// Get messages for specific conversation
app.get("/messages/:email", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userEmail = req.session.userId.replace(/[.#$[\]]/g, "_");
  const conversationEmail = req.params.email.replace(/[.#$[\]]/g, "_");
  const messagesRef = db.ref(`messages/${userEmail}`);

  messagesRef.once("value")
    .then((snapshot) => {
      const allMessages = snapshot.val() || {};
      const filteredMessages = Object.values(allMessages).filter(message => {
        return message.recipient === conversationEmail || 
               message.sender === conversationEmail;
      });

      res.json(filteredMessages);
    })
    .catch(error => {
      console.error("Error fetching messages:", error.message);
      res.status(500).json({ error: "Failed to load messages." });
    });
});

// Send message route
app.post("/send-message", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to send messages.");
    return res.redirect("/login");
  }

  const { recipient, message } = req.body;
  if (!recipient || !message) {
    req.flash("error_msg", "Recipient and message are required.");
    return res.redirect("/inbox");
  }

  const sanitizedSender = req.session.userId.replace(/[.#$[\]]/g, "_");
  const sanitizedRecipient = recipient.replace(/[.#$[\]]/g, "_");
  const timestamp = Date.now();

  const senderRef = db.ref(`messages/${sanitizedSender}/${timestamp}`);
  const recipientRef = db.ref(`messages/${sanitizedRecipient}/${timestamp}`);

  const senderData = {
    recipient: sanitizedRecipient,
    message,
    timestamp,
  };

  const recipientData = {
    sender: sanitizedSender,
    message,
    timestamp,
  };

  Promise.all([senderRef.set(senderData), recipientRef.set(recipientData)])
    .then(() => {
      req.flash("success_msg", "Message sent successfully!");
      res.redirect("/inbox");
    })
    .catch(error => {
      console.error("Failed to send message:", error.message);
      req.flash("error_msg", "Failed to send message.");
      res.redirect("/inbox");
    });
});

// Sell item route
app.post("/sell-item", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to sell an item.");
    return res.redirect("/login");
  }

  const { name, condition, price, description } = req.body;
  if (!name || !condition || !price || !description) {
    req.flash("error_msg", "All fields are required.");
    return res.redirect("/sell");
  }

  const sanitizedEmail = req.session.userId.replace(/[.#$[\]]/g, "_");
  const productKey = name.replace(/\s+/g, "_").toLowerCase();
  const sellItemsRef = db.ref(`sellItems/${sanitizedEmail}/${productKey}`);

  const itemData = {
    id: productKey,
    name,
    condition,
    price,
    description,
    sellerEmail: req.session.userId,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  };

  sellItemsRef.set(itemData)
    .then(() => {
      req.flash("success_msg", "Item listed successfully!");
      res.redirect("/browse");
    })
    .catch(error => {
      console.error("Failed to list item:", error.message);
      req.flash("error_msg", "Failed to list item.");
      res.redirect("/sell");
    });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash("error_msg", "Email and password are required.");
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
    console.error("Login error:", error.message);
    req.flash("error_msg", "Login failed.");
    res.redirect("/login");
  });
});

// Use route files
app.use("/listings", listingsRoutes);
app.use("/", userRoutes);

// Error handlers
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