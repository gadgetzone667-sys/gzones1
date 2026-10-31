import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import reviewRoutes from "./routes/reviews.js";
import orderRoutes from "./routes/orders.js";
import componentRoutes from "./routes/components.js";
import serviceRoutes from "./routes/services.js";
import contactRoutes from "./routes/contact.js";

const app = express();

// Middleware: Enable CORS for all origins, IP addresses, and custom domains
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// High-capacity JSON parser to support direct product photo uploads (up to 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure MongoDB is connected
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn("MongoDB connection check:", err.message);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);

// Root & Health routes
app.get("/", (_req, res) =>
  res.json({ message: "GadgetZone API Server is running." })
);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

export default app;
