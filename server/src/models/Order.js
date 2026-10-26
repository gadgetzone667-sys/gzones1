import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  shippingInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String, default: "" },
    address: { type: String, required: true },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    country: { type: String, default: "India" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    notes: String
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  trackingStage: {
    type: Number,
    default: 1 // 1: Order Placed, 2: Processing & Assembly, 3: Out for Delivery, 4: Delivered
  },
  trackingNotes: String,
  paymentMethod: {
    type: String,
    default: "Cash on Delivery"
  },
  trackingId: {
    type: String,
  },
  courier: {
    type: String,
    default: "SpeedPost Express"
  },
  estimatedDeliveryDate: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Order", orderSchema);
