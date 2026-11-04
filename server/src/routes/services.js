import express from "express";
import Service from "../models/Service.js";
import ServiceBooking from "../models/ServiceBooking.js";
import { requireAdmin, requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

function parseFeaturesInput(features) {
  if (Array.isArray(features)) {
    return features
      .map((f) => (typeof f === "string" ? f.trim().replace(/^[\s•\-\*]+/, "") : ""))
      .filter(Boolean);
  }
  if (typeof features === "string") {
    return features
      .split(/[\n,]/)
      .map((f) => f.trim().replace(/^[\s•\-\*]+/, ""))
      .filter(Boolean);
  }
  return [];
}

// ==========================================
// 1. SERVICES CATALOG & PRICING
// ==========================================

// GET /api/services - Fetch all services
router.get("/", async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(
      (services || []).map((s) => {
        const features = (Array.isArray(s.features) ? s.features : []).filter(Boolean);
        const desc = s.description || "";

        return {
          id: s._id.toString(),
          name: s.name,
          description: desc,
          price: s.price,
          icon: s.icon || "Wrench",
          features,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: "Server error fetching services.", error: err.message });
  }
});

// POST /api/services (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description, price, icon, features, provideService } = req.body;
    const parsedFeatures = parseFeaturesInput(features || provideService);

    const service = await Service.create({
      name,
      description,
      price,
      icon: icon || "Wrench",
      features: parsedFeatures,
    });
    res.status(201).json({
      id: service._id.toString(),
      name: service.name,
      description: service.description,
      price: service.price,
      icon: service.icon,
      features: service.features,
    });
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// PUT /api/services/:id (admin only - update pricing and details)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.features || updateData.provideService) {
      updateData.features = parseFeaturesInput(updateData.features || updateData.provideService);
    }

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({
      id: service._id.toString(),
      name: service.name,
      description: service.description,
      price: service.price,
      icon: service.icon,
      features: service.features,
    });
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// DELETE /api/services/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({ message: "Service deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ==========================================
// 2. CUSTOMER SERVICE BOOKINGS
// ==========================================

// POST /api/services/book - Create a new customer service booking
router.post("/book", optionalAuth, async (req, res) => {
  try {
    const {
      name,
      customerName,
      phone1,
      phone,
      phone2,
      address,
      serviceId,
      serviceName,
      servicePrice,
      date,
      bookingDate,
      time,
      preferredTime,
      purpose,
      email,
    } = req.body;

    const finalName = (customerName || name || "").trim();
    const finalPhone = (phone1 || phone || "").trim();
    const finalAddress = (address || "").trim();
    const finalPurpose = (purpose || "").trim();
    const finalDate = (bookingDate || date || "").trim();
    const finalTime = (preferredTime || time || "").trim();
    const finalService = (serviceName || "General Tech Service").trim();

    if (!finalName || !finalPhone || !finalAddress || !finalPurpose || !finalDate || !finalTime) {
      return res.status(400).json({
        message: "Please fill in all required fields: name, phone, address, date, time, and service details.",
      });
    }

    // Generate unique human-readable booking ID: GZ-SRV-XXXX
    let bookingId = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const candidate = `GZ-SRV-${rand}`;
      const existing = await ServiceBooking.findOne({ bookingId: candidate });
      if (!existing) {
        bookingId = candidate;
        isUnique = true;
      }
    }
    if (!bookingId) {
      bookingId = `GZ-SRV-${Date.now().toString().slice(-4)}`;
    }

    const userId = req.user?.id || req.user?._id || null;
    const userEmail = req.user?.email || email || "";

    const booking = await ServiceBooking.create({
      bookingId,
      userId,
      userEmail,
      customerName: finalName,
      phone1: finalPhone,
      phone2: (phone2 || "").trim(),
      address: finalAddress,
      serviceId: serviceId || "",
      serviceName: finalService,
      servicePrice: servicePrice || "Quote on Inspection",
      bookingDate: finalDate,
      preferredTime: finalTime,
      purpose: finalPurpose,
      status: "Pending",
      statusHistory: [
        {
          status: "Pending",
          note: "Service booking request submitted by customer",
          updatedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      booking,
      message: `Service booking ${booking.bookingId} created successfully!`,
    });
  } catch (err) {
    console.error("Service booking creation error:", err);
    res.status(500).json({ message: "Failed to create service booking.", error: err.message });
  }
});

// GET /api/services/my-bookings - Fetch authenticated user's service bookings
router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email;

    const query = {
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(userEmail ? [{ userEmail }] : []),
      ],
    };

    const bookings = await ServiceBooking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching user service bookings:", err);
    res.status(500).json({ message: "Failed to fetch service bookings.", error: err.message });
  }
});

// GET /api/services/bookings - Admin: Fetch all customer service bookings with optional status filter
router.get("/bookings", requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { bookingId: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { phone1: { $regex: q, $options: "i" } },
        { serviceName: { $regex: q, $options: "i" } },
      ];
    }

    const bookings = await ServiceBooking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching admin service bookings:", err);
    res.status(500).json({ message: "Failed to fetch service bookings.", error: err.message });
  }
});

// PATCH /api/services/bookings/:id/status - Admin: Update status and technician remarks
router.patch("/bookings/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, technicianNotes, assignedTechnician } = req.body;

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }

    if (status && status !== booking.status) {
      booking.status = status;
      booking.statusHistory.push({
        status,
        note: technicianNotes || `Status updated to ${status} by admin`,
        updatedAt: new Date(),
      });
    }

    if (technicianNotes !== undefined) booking.technicianNotes = technicianNotes;
    if (assignedTechnician) booking.assignedTechnician = assignedTechnician;

    await booking.save();

    res.json({
      success: true,
      booking,
      message: `Booking ${booking.bookingId} updated to ${booking.status}.`,
    });
  } catch (err) {
    console.error("Error updating service booking status:", err);
    res.status(500).json({ message: "Failed to update booking status.", error: err.message });
  }
});

// PATCH /api/services/bookings/:id/cancel - User or Admin cancel service booking
router.patch("/bookings/:id/cancel", optionalAuth, async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }

    // Completed bookings cannot be cancelled
    if (booking.status === "Completed") {
      return res.status(400).json({ message: "Completed service bookings cannot be cancelled." });
    }

    booking.status = "Cancelled";
    booking.statusHistory.push({
      status: "Cancelled",
      note: req.body.reason || "Booking cancelled by customer",
      updatedAt: new Date(),
    });

    await booking.save();

    res.json({
      success: true,
      booking,
      message: `Service booking ${booking.bookingId} cancelled.`,
    });
  } catch (err) {
    console.error("Error cancelling service booking:", err);
    res.status(500).json({ message: "Failed to cancel service booking.", error: err.message });
  }
});

// DELETE /api/services/bookings/:id - Admin: Delete service booking
router.delete("/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const booking = await ServiceBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }
    res.json({ success: true, message: `Service booking ${booking.bookingId} deleted.` });
  } catch (err) {
    console.error("Error deleting service booking:", err);
    res.status(500).json({ message: "Failed to delete service booking.", error: err.message });
  }
});

export default router;
