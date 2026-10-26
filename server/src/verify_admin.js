import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "admin@gzones.in" });
    if (!user) {
      console.error("Admin user 'admin@gzones.in' not found!");
      return;
    }
    const match = await bcrypt.compare("Vijay@2223", user.passwordHash);
    console.log(`✅ Admin user 'admin@gzones.in' found in MongoDB. Is Admin: ${user.isAdmin}. Password match ('Vijay@2223'): ${match}`);
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
