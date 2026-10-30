import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      default: "guest",
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      alternatePhone: { type: String, default: "", trim: true },
    },
    shippingAddress: {
      address: { type: String, required: true },
      address1: { type: String, default: "" },
      address2: { type: String, default: "" },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      country: { type: String, default: "India" },
      notes: { type: String, default: "" },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        "Order must contain at least one item.",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },
    trackingStage: {
      type: Number,
      default: 1, // 1: Pending/Placed, 2: Confirmed/Processing, 3: Shipped/Out for Delivery, 4: Delivered, 0: Cancelled
    },
    trackingId: {
      type: String,
      index: true,
    },
    courier: {
      type: String,
      default: "SpeedPost Express",
    },
    estimatedDeliveryDate: {
      type: String,
      default: "",
    },

    // --- Backwards Compatibility Aliases ---
    // These allow existing code referencing .status, .totalPrice, or .shippingInfo to work seamlessly
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    totalPrice: {
      type: Number,
    },
    shippingInfo: {
      name: { type: String },
      phone: { type: String },
      alternatePhone: { type: String, default: "" },
      address: { type: String },
      address1: { type: String, default: "" },
      address2: { type: String, default: "" },
      country: { type: String, default: "India" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to synchronize aliases
orderSchema.pre("save", function (next) {
  if (this.orderStatus && !this.status) {
    this.status = this.orderStatus;
  } else if (this.status && !this.orderStatus) {
    this.orderStatus = this.status;
  }

  if (this.grandTotal !== undefined && this.totalPrice === undefined) {
    this.totalPrice = this.grandTotal;
  } else if (this.totalPrice !== undefined && this.grandTotal === undefined) {
    this.grandTotal = this.totalPrice;
  }

  // Populate shippingInfo alias if empty
  if (this.customer && this.shippingAddress && (!this.shippingInfo || !this.shippingInfo.name)) {
    this.shippingInfo = {
      name: this.customer.name,
      phone: this.customer.phone,
      alternatePhone: this.customer.alternatePhone || "",
      address: this.shippingAddress.address,
      address1: this.shippingAddress.address1 || "",
      address2: this.shippingAddress.address2 || "",
      city: this.shippingAddress.city || "",
      state: this.shippingAddress.state || "",
      country: this.shippingAddress.country || "India",
      pincode: this.shippingAddress.pincode || "",
      notes: this.shippingAddress.notes || "",
    };
  }

  next();
});

export default mongoose.model("Order", orderSchema);
