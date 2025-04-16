const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // 🔁 Make sure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://webapp-d140b-default-rtdb.firebaseio.com", // ✅ Remove trailing slash
  storageBucket: "webapp-d140b.appspot.com"
});

const bucket = admin.storage().bucket();
const db = admin.database();

module.exports = { admin, bucket, db };
