const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/assets/images/listings");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file and provide a descriptive error message
    const error = new Error("Invalid file type. Only JPEG, PNG, and GIF images are allowed.");
    error.status = 400; // Bad Request
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
}).single("image");

module.exports = upload;
