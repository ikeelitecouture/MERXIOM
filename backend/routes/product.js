const express = require("express");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");

const {
  createProduct,
  getProducts,
  getMyProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/mine", protect, getMyProducts);

router.post(
  "/",
  protect,
  upload.array("images", 5),
  createProduct
);

router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  updateProduct
);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
