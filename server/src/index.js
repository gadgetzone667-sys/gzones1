import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "gadgetzone-5611f",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

dotenv.config();

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import reviewRoutes from "./routes/reviews.js";
import orderRoutes from "./routes/orders.js";
import componentRoutes from "./routes/components.js";
import serviceRoutes from "./routes/services.js";
import contactRoutes from "./routes/contact.js";

const app = express();

// Middleware: Configure CORS for main domain and admin subdomain
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://admin.localhost:5173",
  "http://localhost:3000",
  "https://gzones.in",
  "https://www.gzones.in",
  "https://admin.gzones.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*gzones\.in(?::\d+)?$/.test(origin) ||
        /^http:\/\/(?:[a-zA-Z0-9-]+\.)*localhost(?::\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);

// Root status route
app.get("/", (_req, res) => res.json({ message: "GadgetZone API Server is running. Access the web app at http://localhost:5173" }));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Express server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the application:", error.message);
    process.exit(1);
  }
}

startServer();
