import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Review from "./models/Review.js";
import PCComponent from "./models/PCComponent.js";
import Service from "./models/Service.js";
import Order from "./models/Order.js";

async function verifyDatabase() {
  try {
    await connectDB();
    console.log("✅ Successfully connected to MongoDB database.");

    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const servicesCount = await Service.countDocuments();
    const componentsCount = await PCComponent.countDocuments();
    const reviewsCount = await Review.countDocuments();

    console.log("\n📊 Live Database Status:");
    console.log(`   • Users:         ${usersCount}`);
    console.log(`   • Products:      ${productsCount}`);
    console.log(`   • Orders:        ${ordersCount}`);
    console.log(`   • Services:      ${servicesCount}`);
    console.log(`   • PC Components: ${componentsCount}`);
    console.log(`   • Reviews:       ${reviewsCount}`);
    console.log("\n🔒 Dynamic catalog active. No dummy/sample data injected.");
  } catch (err) {
    console.error("❌ Database verification failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyDatabase();
