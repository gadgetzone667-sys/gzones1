import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
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

// Ensure MongoDB is connected for API requests
app.use(async (req, res, next) => {
  // Always permit health checks even if DB is still establishing connection
  if (req.path === "/" || req.path === "/api/health") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure on request:", req.method, req.path, err.message);
    return res.status(503).json({
      error: "Database Connection Error",
      message: "The database service is currently connecting or unreachable. Please try again in a moment.",
      details: err.message,
    });
  }
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
  res.json({
    message: "GadgetZone API Server is running.",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting/disconnected",
  })
);

app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting/disconnected",
    uptime: process.uptime(),
  })
);

export default app;
