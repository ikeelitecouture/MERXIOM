const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const shippingRoutes = require("./routes/shipping");
const paymentRoutes = require("./routes/payment");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(require("path").join(__dirname, "uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AXIOM API is online 🚀",
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "AXIOM Backend"
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`AXIOM Backend running on port ${PORT}`);
  });
};

startServer();
