const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

// Firebase Admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://webapp-d140b-default-rtdb.firebaseio.com",
  storageBucket: "webapp-d140b.appspot.com",
});

const db = admin.database();

// Test Firebase Realtime Database connection
db.ref("test")
  .set({ connected: true })
  .then(() => {
    console.log("✅ Firebase Realtime Database write succeeded.");
  })
  .catch((error) => {
    console.error("❌ Firebase Realtime Database write failed:", error.message);
  });

// Test Firebase Admin connection via Auth
admin
  .auth()
  .listUsers(1)
  .then(() => {
    console.log("✅ Firebase Auth connected successfully.");
  })
  .catch((error) => {
    console.error("❌ Firebase Auth connection failed:", error.message);
  });

// Create Express app
const app = express();
let port = 3001;
let host = "localhost";

// Set view engine
app.set("view engine", "ejs");

// MongoDB URI
const mongUri =
  "mongodb+srv://admin:admin123@cluster0.zvlta.mongodb.net/normsTradingPost?retryWrites=true&w=majority&appName=Cluster0";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(mongUri)
  .then(() => {
    app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  })
  .catch((err) => console.log(err.message));

// Session configuration
app.use(
  session({
    secret: "ajfeirf90aeu9eroejfoefj",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: mongUri }),
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// Flash messages
app.use(flash());

// Set global template variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.isAuthenticated = req.session.userId ? true : false;
  res.locals.currentPath = req.path;
  next();
});

// Route to handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Log login attempt to Firebase Realtime Database
  const sanitizedEmail = email.replace(/[.#$[\]]/g, "_"); // Replace special characters
  const loginAttemptRef = db.ref(`loginAttempts/${sanitizedEmail}`);

  loginAttemptRef
    .set({
      email,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    })
    .then(() => {
      console.log(`Login attempt logged for email: ${email}`);
      // Save user session
      req.session.userId = email;
      req.flash("success_msg", "Login successful!");
      res.redirect("/browse"); // Redirect to browse page
    })
    .catch((error) => {
      console.error("Failed to log login attempt:", error.message);
      req.flash("error_msg", "Login failed!");
      res.redirect("/login");
    });
});









// Route to display all items listed for sale
app.get("/browse", (req, res) => {
  // Ensure user is logged in
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to access this page.");
    return res.redirect("/login");
  }

  // Firebase reference for sell items
  const sellItemsRef = db.ref("sellItems");

  sellItemsRef
    .once("value")
    .then((snapshot) => {
      // Fetch all items or initialize as an empty object
      const allItems = snapshot.val() || {};
      const productList = [];

      // Extract all items from all users
      Object.keys(allItems).forEach((userKey) => {
        const userItems = allItems[userKey];
        if (userItems) {
          productList.push(...Object.values(userItems)); // Flatten user items into productList
        }
      });

      // Render the 'browse' page with the list of products
      res.render("listings/browse", {
        title: "Browse Items",
        user: req.session.userId,
        products: productList,
      });
    })
    .catch((error) => {
      // Log errors and display an error message to the user
      console.error("Error fetching sell items:", error.message);
      req.flash("error_msg", "Failed to load items.");
      res.redirect("/");
    });
});















app.get("/details", (req, res) => {
  const productId = req.query.id;

  if (!productId) {
    req.flash("error_msg", "Product not found.");
    return res.redirect("/browse");
  }

  const sellItemsRef = db.ref("sellItems");

  sellItemsRef
    .once("value")
    .then((snapshot) => {
      const allItems = snapshot.val() || {};
      let product = null;

      Object.keys(allItems).forEach((userKey) => {
        const userItems = allItems[userKey];
        if (userItems) {
          // Find the product by ID
          const item = Object.values(userItems).find(
            (item) => item.id === productId
          );
          if (item) {
            product = item;
          }
        }
      });

      if (!product) {
        req.flash("error_msg", "Product not found.");
        return res.redirect("/browse");
      }

      res.render("listings/details", { product });
    })
    .catch((error) => {
      console.error("Error fetching product details:", error.message);
      req.flash("error_msg", "Failed to load product details.");
      res.redirect("/browse");
    });
});

// Route to render details.ejs page
app.get("/details", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to access this page.");
    return res.redirect("/login");
  }
  res.render("listings/details", { title: "Product Details", user: req.session.userId });
});

// Route to render inbox.ejs page when the image is clicked
app.get("/inbox", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to view your inbox.");
    return res.redirect("/login");
  }

  // Sample messages data (to be replaced with DB logic)
  const messages = [
    { sender: "user1@example.com", text: "Hello! Is the product still available?", timestamp: Date.now() - 60000 },
    { sender: "user2@example.com", text: "Can I get a discount?", timestamp: Date.now() - 3600000 },
  ];

  res.render("inbox", { title: "Inbox", user: req.session.userId, messages });
});



app.get("/messages/:email", (req, res) => {
  if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  const userEmail = req.session.userId.replace(/[.#$[\]]/g, "_"); // Current user
  const conversationEmail = req.params.email.replace(/[.#$[\]]/g, "_"); // Selected conversation email

  // Path to the user's messages
  const firebasePath = `messages/${userEmail}`;
  console.log("Fetching messages from path:", firebasePath);

  // Fetch all messages under the user's path
  db.ref(firebasePath)
      .once("value")
      .then((snapshot) => {
     
          const allMessages = snapshot.val() || {}; // Get all messages or an empty object
          const filteredMessages = Object.values(allMessages).filter((message) => {
            // Debug each message to understand why it might not pass the filter
            console.log("Checking message:", message);
            const isRecipientMatch = message.recipient === conversationEmail;
            const isSenderMatch = message.sender === conversationEmail;
            console.log(
              `Message1111111: ${JSON.stringify(message)}, isRecipientMatch: ${isRecipientMatch}, isSenderMatch: ${isSenderMatch}`
            );
            return "hello";
          });

          // Return filtered messages
          res.json(filteredMessages);
          console.log("Fetching messages from path:aaaaa", filteredMessages);
      })
      .catch((error) => {
          console.error("Error fetching messages:", error.message);
          res.status(500).json({ error: "Failed to load messages." });
      });
});


// Route to handle "Sell Item" form submission
app.post("/sell-item", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to sell an item.");
    return res.redirect("/login");
  }

  const { name, condition, price, description } = req.body;

  // Validate form inputs
  if (!name || !condition || !price || !description) {
    req.flash("error_msg", "All fields are required.");
    return res.redirect("/sell");
  }

 // Sanitize the user's email to create a valid Firebase key
const sanitizedEmail = req.session.userId.replace(/[.#$[\]]/g, "_");

// Firebase reference for the user's sell items
const sellItemsRef = db.ref(`sellItems/${sanitizedEmail}`);

// Create a unique ID for the item (or use the product name as a key)
const productKey = name.replace(/\s+/g, "_").toLowerCase(); // Create a safe key from the product name

// Item data to store in Firebase
const itemData = {
  id: productKey, // Using the product name as a key ensures a unique identifier
  name,
  condition,
  price,
  description,
  sellerEmail: req.session.userId,
  timestamp: admin.database.ServerValue.TIMESTAMP,
};

// Save the item data under the product name key
sellItemsRef
  .child(productKey)
  .set(itemData)
  .then(() => {
    console.log(`Item "${name}" added by user: ${req.session.userId}`);
    req.flash("success_msg", "Item listed for sale successfully!");
    res.redirect("/browse");
  })
  .catch((error) => {
    console.error("Failed to save item:", error.message);
    req.flash("error_msg", "Failed to list the item for sale.");
    res.redirect("/sell");
  });

});





app.get("/browse", (req, res) => {
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to access this page.");
    return res.redirect("/login");
  }

  const sellItemsRef = db.ref("sellItems");

  sellItemsRef
    .once("value")
    .then((snapshot) => {
      const allItems = snapshot.val() || {};
      const productList = [];

      Object.keys(allItems).forEach((userKey) => {
        const userItems = allItems[userKey];
        if (userItems) {
          productList.push(...Object.values(userItems)); // Flatten user items into productList
        }
      });

      res.render("listings/browse", {
        title: "Browse Items",
        user: req.session.userId,
        products: productList, // Ensure sellerEmail is part of these objects
      });
    })
    .catch((error) => {
      console.error("Error fetching sell items:", error.message);
      req.flash("error_msg", "Failed to load items.");
      res.redirect("/");
    });
});


// Route to handle sending messages
app.post("/send-message", (req, res) => {
  const { recipient, message, recipientName } = req.body;

  // Check if the user is logged in
  if (!req.session.userId) {
    req.flash("error_msg", "Please log in to send messages.");
    return res.redirect("/login");
  }

  // Sanitize sender and recipient email to replace invalid characters
  const sanitizedSender = req.session.userId.replace(/[.#$[\]]/g, "_");
  const sanitizedRecipient = recipient.replace(/[.#$[\]]/g, "_");

  // Validate inputs
  if (!recipient || !message) {
    req.flash("error_msg", "Recipient and message are required.");
    return res.redirect("/inbox");
  }

  // Provide a fallback for recipientName if it's missing
  const safeRecipientName = recipientName || "Unknown Recipient";

  // Generate timestamp as the unique key
  const timestamp = Date.now();

  // Firebase Realtime Database references
  const senderRef = db.ref(`messages/${sanitizedSender}/${timestamp}`);
  const recipientRef = db.ref(`messages/${sanitizedRecipient}/${timestamp}`);

  // Sender's data
  const senderData = {
    recipient,
    recipientName: safeRecipientName,
    message,
    timestamp,
  };

  // Recipient's data
  const recipientData = {
    sender: req.session.userId,
    message,
    timestamp,
  };

  // Save data for both sender and recipient
  Promise.all([senderRef.set(senderData), recipientRef.set(recipientData)])
    .then(() => {
      console.log(`Message sent to ${recipient}: ${message}`);
      req.flash("success_msg", "Message sent successfully!");
      res.redirect("/inbox");
    })
    .catch((error) => {
      console.error("Failed to save message:", error.message);
      req.flash("error_msg", "Failed to send the message.");
      res.redirect("/inbox");
    });
});

// Route files
const indexRoutes = require("./routes/indexRoute");
const userRoutes = require("./routes/userRoute");
const listingsRoutes = require("./routes/listingsRoute");

app.use("/", indexRoutes);
app.use("/", userRoutes);
app.use("/", listingsRoutes);

// Views and static files
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = app.get("views/partials");
app.use(express.static(path.join(__dirname, "public")));
