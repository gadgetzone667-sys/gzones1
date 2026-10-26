import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";

async function seedOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne({ email: "user@example.com" });
    if (!user) {
      console.log("User not found!");
      return;
    }

    const products = await Product.find().limit(3);
    if (products.length === 0) {
      console.log("No products found!");
      return;
    }

    const orders = [
      {
        userId: user._id,
        items: [
          {
            productId: products[0]._id,
            name: products[0].name,
            price: products[0].price,
            quantity: 1
          }
        ],
        totalPrice: products[0].price,
        shippingInfo: {
          name: "Test User",
          phone: "1234567890",
          address: "123 Test St",
        },
        status: "Delivered",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        userId: user._id,
        items: [
          {
            productId: products[1]?._id || products[0]._id,
            name: products[1]?.name || products[0].name,
            price: products[1]?.price || products[0].price,
            quantity: 2
          }
        ],
        totalPrice: (products[1]?.price || products[0].price) * 2,
        shippingInfo: {
          name: "Test User",
          phone: "1234567890",
          address: "123 Test St",
        },
        status: "Processing",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    await Order.insertMany(orders);
    console.log("✅ Seeded order history for user@example.com");

  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedOrders();
