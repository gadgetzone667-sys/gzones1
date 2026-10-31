import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import dns from "dns";

// Windows Node.js querySrv ECONNREFUSED workaround for local ISP/router DNS when connecting to MongoDB Atlas (+srv)
const targetUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (targetUri.includes("mongodb+srv://")) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Continue with default system DNS if setServers is unavailable
  }
}

// Redact credentials from error messages to protect sensitive details
function sanitizeError(error) {
  if (!error) return "Unknown error occurred";
  const message = error.message || String(error);
  return message.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
}

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  // Prevent duplicate connections if already connected or connecting
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  // Gracefully handle accidental placeholder angle brackets in URI if present
  let connectionUri = uri;
  if (connectionUri.includes(":<") && connectionUri.includes(">@")) {
    connectionUri = connectionUri.replace(":<", ":").replace(">@", "@");
  }

  try {
    await mongoose.connect(connectionUri);
    isConnected = true;
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    const safeMessage = sanitizeError(error);
    console.error("❌ MongoDB connection error:", safeMessage);
    throw new Error(safeMessage);
  }
}

export default connectDB;
