import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PCComponent from "../models/PCComponent.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper to generate unique human-readable Order ID: GZ-YYYYMMDD-XXXX
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GZ-${dateStr}-${randomSuffix}`;
}

// -------------------------------------------------------------
// 1. POST /api/orders - Customer Order Placement (Public Access)
// -------------------------------------------------------------
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      items,
      customer,
      shippingAddress,
      shippingInfo, // backward-compatibility input
      paymentMethod = "Cash on Delivery",
      notes,
    } = req.body;

    // Normalize customer details
    const customerData = {
      name: (customer?.name || shippingInfo?.name || "").trim(),
      email: (customer?.email || req.body.email || req.user?.email || "").trim().toLowerCase(),
      phone: (customer?.phone || shippingInfo?.phone || "").trim(),
      alternatePhone: (customer?.alternatePhone || shippingInfo?.alternatePhone || "").trim(),
    };

    // Normalize shipping address details
    const effectiveCity = (shippingAddress?.city || shippingInfo?.city || "").trim();
    const effectiveState = (shippingAddress?.state || shippingInfo?.state || "").trim();
    const effectivePincode = (shippingAddress?.pincode || shippingInfo?.pincode || "").trim();
    const effectiveAddress1 = (shippingAddress?.address1 || shippingInfo?.address1 || shippingAddress?.address || shippingInfo?.address || "").trim();
    const effectiveAddress2 = (shippingAddress?.address2 || shippingInfo?.address2 || "").trim();

    const fullFormattedAddress = shippingAddress?.address || shippingInfo?.address || 
      `${effectiveAddress1}${effectiveAddress2 ? `, ${effectiveAddress2}` : ""}, ${effectiveCity}, ${effectiveState} - ${effectivePincode}`;

    const shippingData = {
      address: fullFormattedAddress,
      address1: effectiveAddress1,
      address2: effectiveAddress2,
      city: effectiveCity,
      state: effectiveState,
      pincode: effectivePincode,
      country: shippingAddress?.country || shippingInfo?.country || "India",
      notes: (notes || shippingAddress?.notes || shippingInfo?.notes || "").trim(),
    };

    // Validate customer inputs
    if (!customerData.name || !customerData.phone || !customerData.email) {
      return res.status(400).json({
        message: "Customer name, valid phone number, and email address are required.",
      });
    }

    if (!effectiveAddress1 || !effectiveCity || !effectiveState || !effectivePincode) {
      return res.status(400).json({
        message: "Complete delivery address including street, city, state, and pincode is required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one product." });
    }

    // ---------------------------------------------------------
    // Idempotency: Prevent duplicate orders from rapid clicks
    // ---------------------------------------------------------
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentDuplicate = await Order.findOne({
      "customer.phone": customerData.phone,
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (recentDuplicate) {
      // Return existing order to prevent double-charging/double-processing
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        order: recentDuplicate,
        message: "Order was already placed recently.",
      });
    }

    // ---------------------------------------------------------
    // Backend Price Calculation & Verification
    // Never trust prices or totals submitted by the client
    // ---------------------------------------------------------
    const verifiedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const rawId = item.productId || item.id || "";
      let verifiedPrice = Number(item.price);
      let verifiedName = item.name || "Hardware Product";
      let verifiedImage = item.image || "";

      // If valid MongoDB ObjectId, verify against database Product or Component catalog
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        try {
          const dbProduct = await Product.findById(rawId);
          if (dbProduct) {
            verifiedPrice = dbProduct.price;
            verifiedName = dbProduct.name;
            verifiedImage = dbProduct.image || verifiedImage;
          } else {
            const dbComp = await PCComponent.findById(rawId);
            if (dbComp) {
              verifiedPrice = dbComp.price;
              verifiedName = dbComp.name;
              verifiedImage = dbComp.image || verifiedImage;
            }
          }
        } catch {
          // Proceed with validated snapshot
        }
      }

      // Safeguard price
      if (isNaN(verifiedPrice) || verifiedPrice < 0) {
        verifiedPrice = 0;
      }

      const itemSubtotal = verifiedPrice * qty;
      calculatedSubtotal += itemSubtotal;

      verifiedItems.push({
        productId: String(rawId),
        name: verifiedName,
        image: verifiedImage,
        price: verifiedPrice,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    const deliveryCharges = 0; // Free delivery policy
    const grandTotal = calculatedSubtotal + deliveryCharges;

    const uniqueOrderId = req.body.orderId || generateOrderId();
    const trackingId = req.body.trackingId || `TRK-GZ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await Order.create({
      orderId: uniqueOrderId,
      userId: req.user?.id || req.body.userId || "guest",
      customer: customerData,
      shippingAddress: shippingData,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      deliveryCharges,
      grandTotal,
      paymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      trackingStage: 1,
      trackingId,
      courier: "SpeedPost Express",
      estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });

    res.status(201).json({
      success: true,
      order: newOrder,
      message: "Order placed and saved successfully in MongoDB.",
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error creating order.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 2. GET /api/orders - Admin Orders Management & Statistics
// -------------------------------------------------------------
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      dateRange,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Filter by search query (Order ID, Customer Name, Phone, Email, City)
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      filter.$or = [
        { orderId: regex },
        { trackingId: regex },
        { "customer.name": regex },
        { "customer.phone": regex },
        { "customer.email": regex },
        { "shippingAddress.city": regex },
        { "shippingInfo.name": regex },
        { "shippingInfo.phone": regex },
        { "items.name": regex },
      ];
    }

    // Filter by order status
    if (status && status !== "all") {
      filter.$or = filter.$or
        ? [{ $and: [{ $or: filter.$or }, { $or: [{ orderStatus: status }, { status: status }] }] }]
        : [{ orderStatus: status }, { status: status }];
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        filter.createdAt = { $gte: startOfDay };
      } else if (dateRange === "last7days") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filter.createdAt = { $gte: sevenDaysAgo };
      } else if (dateRange === "last30days") {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filter.createdAt = { $gte: thirtyDaysAgo };
      }
    }

    // Sorting
    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    // ---------------------------------------------------------
    // Compute System-wide Order Statistics (excluding cancelled from revenue)
    // ---------------------------------------------------------
    const allOrders = await Order.find({}, "orderStatus status grandTotal totalPrice paymentStatus");

    let totalRevenue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    for (const o of allOrders) {
      const currentStatus = o.orderStatus || o.status || "Pending";
      const totalAmount = Number(o.grandTotal || o.totalPrice || 0);

      if (currentStatus === "Pending") pendingCount++;
      else if (currentStatus === "Confirmed" || currentStatus === "Processing") confirmedCount++;
      else if (currentStatus === "Delivered") deliveredCount++;
      else if (currentStatus === "Cancelled") cancelledCount++;

      // Revenue excludes cancelled orders
      if (currentStatus !== "Cancelled") {
        totalRevenue += totalAmount;
      }
    }

    const stats = {
      totalOrders: allOrders.length,
      pendingOrders: pendingCount,
      confirmedOrders: confirmedCount,
      deliveredOrders: deliveredCount,
      cancelledOrders: cancelledCount,
      totalRevenue,
    };

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      stats,
    });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching administrative orders.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 3. GET /api/orders/my-orders - Customer Order History
// -------------------------------------------------------------
router.get("/my-orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { userId: req.user.id },
        { "customer.email": req.user.email?.toLowerCase() },
      ],
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error fetching user orders.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 4. GET /api/orders/:id - Single Order Details
// -------------------------------------------------------------
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const param = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      order = await Order.findById(param);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderId: param }, { trackingId: param }] });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error retrieving order.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 5. PATCH /api/orders/:id/status - Update Order Status
// -------------------------------------------------------------
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, trackingStage, courier, trackingId, estimatedDeliveryDate } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    // Determine corresponding tracking stage
    let stage = trackingStage !== undefined ? Number(trackingStage) : undefined;
    if (stage === undefined) {
      if (status === "Pending") stage = 1;
      else if (status === "Confirmed" || status === "Processing") stage = 2;
      else if (status === "Shipped") stage = 3;
      else if (status === "Delivered") stage = 4;
      else if (status === "Cancelled") stage = 0;
    }

    const updateData = {
      orderStatus: status,
      status: status, // alias
      trackingStage: stage,
    };

    if (courier) updateData.courier = courier;
    if (trackingId) updateData.trackingId = trackingId;
    if (estimatedDeliveryDate) updateData.estimatedDeliveryDate = estimatedDeliveryDate;

    const param = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      order = await Order.findByIdAndUpdate(param, updateData, { new: true });
    }
    if (!order) {
      order = await Order.findOneAndUpdate(
        { $or: [{ orderId: param }, { trackingId: param }] },
        updateData,
        { new: true }
      );
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error("Order status update error:", err);
    res.status(500).json({
      success: false,
      message: "Server error updating order status.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 6. PATCH /api/orders/:id/payment-status - Update Payment Status
// -------------------------------------------------------------
router.patch("/:id/payment-status", requireAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validStatuses = ["Pending", "Paid", "Failed", "Refunded"];

    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const param = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      order = await Order.findByIdAndUpdate(param, { paymentStatus }, { new: true });
    }
    if (!order) {
      order = await Order.findOneAndUpdate(
        { $or: [{ orderId: param }, { trackingId: param }] },
        { paymentStatus },
        { new: true }
      );
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order, message: `Payment status updated to ${paymentStatus}` });
  } catch (err) {
    console.error("Payment status update error:", err);
    res.status(500).json({
      success: false,
      message: "Server error updating payment status.",
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 7. DELETE /api/orders/:id - Delete Order Record
// -------------------------------------------------------------
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const param = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      order = await Order.findByIdAndDelete(param);
    }
    if (!order) {
      order = await Order.findOneAndDelete({ $or: [{ orderId: param }, { trackingId: param }] });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, message: "Order deleted successfully." });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error deleting order.",
      error: err.message,
    });
  }
});

export default router;
