const multer = require("multer");
const express = require("express");
const { shoppingAI } = require("../controllers/aiController");
const protect = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  }
});

router.post("/shopping", protect, upload.single("image"), shoppingAI);

module.exports = router;
