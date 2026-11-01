import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dns from "dns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robustly search and load environment variables from all standard locations
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Default MongoDB Atlas production cluster connection string
const DEFAULT_ATLAS_URI = "mongodb+srv://gadgetzone667_db_user:62yCRXapnIhM8rn8@gzone.jbucsqs.mongodb.net/GadgetZone?retryWrites=true&w=majority&compressors=zlib";

// Safe DNS workaround ONLY on Windows where local ISP DNS sometimes fails on +srv queries
const targetUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI;
if (process.platform === "win32" && targetUri.includes("mongodb+srv://")) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Continue with system DNS
  }
}

// Redact credentials from error messages to protect sensitive details
function sanitizeError(error) {
  if (!error) return "Unknown error occurred";
  const message = error.message || String(error);
  return message.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
}

// Cached promise for serverless environments (prevents duplicate connections & race conditions)
let cachedPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI;
  let connectionUri = (rawUri || "").trim();

  // Gracefully handle accidental placeholder angle brackets in URI if present
  if (connectionUri.includes(":<") && connectionUri.includes(">@")) {
    connectionUri = connectionUri.replace(":<", ":").replace(">@", "@");
  }

  cachedPromise = mongoose
    .connect(connectionUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to prevent IPv6 DNS delays
      bufferCommands: true,
    })
    .then((m) => {
      console.log("MongoDB connected successfully");
      return m.connection;
    })
    .catch((error) => {
      cachedPromise = null;
      const safeMessage = sanitizeError(error);
      console.error("❌ MongoDB connection error:", safeMessage);
      throw new Error(safeMessage);
    });

  return cachedPromise;
}

export default connectDB;
