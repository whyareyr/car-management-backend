const express = require("express");
const {
  createCar,
  getCars,
  updateCar,
  deleteCar,
} = require("../controllers/carController.js");
const { protect } = require("../middlewares/authMiddleware.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/", protect, upload.array("images", 10), createCar); // 10 images max
router.get("/", protect, getCars);
router.put("/:id", protect, updateCar);
router.delete("/:id", protect, deleteCar);

module.exports = router;
