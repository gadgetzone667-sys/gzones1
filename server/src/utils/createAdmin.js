import readline from "readline";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import connectDB from "../config/db.js";

function prompt(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email = (args[0] || "").toLowerCase().trim();
  let password = (args[1] || "").trim();

  // If arguments not provided via CLI, prompt interactively
  if (!email) {
    email = (await prompt("Enter Admin Email / Username: ")).toLowerCase().trim();
  }
  if (!password) {
    password = (await prompt("Enter Admin Password (min 8 chars): ")).trim();
  }

  if (!email || !password) {
    console.error("❌ Error: Both Email and Password are required.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Error: Password must be at least 8 characters long for security.");
    process.exit(1);
  }

  try {
    await connectDB();

    // Hash the password with bcrypt (cost factor: 12)
    const passwordHash = await bcrypt.hash(password, 12);
    let user = await User.findOne({ email });

    if (user) {
      user.passwordHash = passwordHash;
      user.isAdmin = true;
      await user.save();
      console.log(`\n✅ Administrator account updated successfully: ${email}`);
    } else {
      user = await User.create({
        email,
        passwordHash,
        isAdmin: true,
        createdAt: new Date(),
      });
      console.log(`\n✅ Administrator account created successfully: ${email}`);
    }

    console.log("🔒 Password has been securely hashed into MongoDB. No plain text is saved anywhere.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Failed to insert admin into MongoDB:", err.message);
    process.exit(1);
  }
}

main();
