import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";

async function updateAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email = "admin@gzones.in";
    const newPassword = "Vijay@2223";
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Upsert admin@gzones.in
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.passwordHash = passwordHash;
      user.isAdmin = true;
      await user.save();
      console.log(`✅ Updated password for existing user '${email}'`);
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        isAdmin: true,
        lastLogin: new Date(),
      });
      console.log(`✅ Created new admin user '${email}'`);
    }

    // Also update existing legacy admin users password if present
    const otherAdmins = ["vijay", "vijay@techspare.com", "admin@techspare.com"];
    for (const otherEmail of otherAdmins) {
      const u = await User.findOne({ email: otherEmail });
      if (u) {
        u.passwordHash = passwordHash;
        u.isAdmin = true;
        await u.save();
        console.log(`✅ Updated password for secondary admin '${otherEmail}'`);
      }
    }

    const verifyMatch = await bcrypt.compare(newPassword, user.passwordHash);
    console.log(`Verification: Admin user '${email}' password match = ${verifyMatch}`);
  } catch (err) {
    console.error("Error updating admin password:", err);
  } finally {
    await mongoose.disconnect();
  }
}

updateAdminPassword();
