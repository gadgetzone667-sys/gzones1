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
      primaryPhone,
      phone,
      phone2,
      alternatePhone,
      address,
      serviceId,
      serviceName,
      date,
      preferredDate,
      bookingDate,
      time,
      preferredTime,
      purpose,
      bookingPurpose,
      email,
    } = req.body;

    // 1. Validate Required Fields
    const finalName = (customerName || name || "").trim();
    const finalPhone = (primaryPhone || phone1 || phone || "").trim();
    const finalAltPhone = (alternatePhone || phone2 || "").trim();
    const finalAddress = (address || "").trim();
    const finalPurpose = (bookingPurpose || purpose || "").trim();
    const finalDate = (preferredDate || bookingDate || date || "").trim();
    const finalTime = (preferredTime || time || "").trim();

    if (!finalName) {
      return res.status(400).json({ message: "Full Name is required." });
    }
    if (!finalPhone) {
      return res.status(400).json({ message: "Primary Phone Number is required." });
    }
    const cleanDigits = finalPhone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      return res.status(400).json({ message: "Please provide a valid 10-digit primary phone number." });
    }
    if (!finalAddress) {
      return res.status(400).json({ message: "Service Address is required." });
    }
    if (!finalPurpose) {
      return res.status(400).json({ message: "Booking purpose / issue description is required." });
    }
    if (!finalDate) {
      return res.status(400).json({ message: "Preferred Date is required." });
    }
    if (!finalTime) {
      return res.status(400).json({ message: "Preferred Time slot is required." });
    }

    // 2. Security: Look up genuine service in MongoDB to prevent browser price tampering
    let actualServiceName = (serviceName || "General Tech Service").trim();
    let actualServicePrice = "Quote on Inspection";
    let genuineServiceId = serviceId || "";

    if (serviceId) {
      try {
        const genuineService = await Service.findById(serviceId);
        if (genuineService) {
          actualServiceName = genuineService.name;
          actualServicePrice = genuineService.price;
          genuineServiceId = genuineService._id.toString();
        }
      } catch {
        // Fallback: search by name
        const genuineService = await Service.findOne({ name: actualServiceName });
        if (genuineService) {
          actualServiceName = genuineService.name;
          actualServicePrice = genuineService.price;
          genuineServiceId = genuineService._id.toString();
        }
      }
    } else if (serviceName) {
      const genuineService = await Service.findOne({ name: serviceName.trim() });
      if (genuineService) {
        actualServiceName = genuineService.name;
        actualServicePrice = genuineService.price;
        genuineServiceId = genuineService._id.toString();
      }
    }

    // 3. Generate Unique Booking ID: #GZ-SRV-0001
    const totalCount = await ServiceBooking.countDocuments();
    let seq = totalCount + 1;
    let candidate = `GZ-SRV-${String(seq).padStart(4, "0")}`;

    while (
      await ServiceBooking.exists({
        $or: [{ bookingId: candidate }, { bookingId: `#${candidate}` }],
      })
    ) {
      seq++;
      candidate = `GZ-SRV-${String(seq).padStart(4, "0")}`;
    }

    const bookingId = candidate;
    const customerId = req.user?.id || req.user?._id || null;
    const userEmail = req.user?.email || email || "";

    // 4. Save Booking to MongoDB Atlas
    const booking = await ServiceBooking.create({
      bookingId,
      customerId,
      userId: customerId,
      userEmail,
      customerName: finalName,
      primaryPhone: finalPhone,
      phone1: finalPhone,
      alternatePhone: finalAltPhone,
      phone2: finalAltPhone,
      address: finalAddress,
      serviceId: genuineServiceId,
      serviceName: actualServiceName,
      servicePrice: actualServicePrice,
      bookingPurpose: finalPurpose,
      purpose: finalPurpose,
      preferredDate: finalDate,
      bookingDate: finalDate,
      preferredTime: finalTime,
      bookingStatus: "Pending Review",
      status: "Pending Review",
      assignedEngineer: "Unassigned",
      assignedTechnician: "Unassigned",
      adminNotes: "",
      technicianNotes: "",
      statusHistory: [
        {
          status: "Pending Review",
          note: "Service booking submitted directly by customer",
          updatedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      booking,
      bookingId: `#${booking.bookingId}`,
      message: `Service booking #${booking.bookingId} submitted successfully! Our team will review and confirm shortly.`,
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
        ...(userId ? [{ userId }, { customerId: userId }] : []),
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

// GET /api/services/bookings - Admin: Fetch all customer service bookings with search & status filters
router.get("/bookings", requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") {
      if (status === "Pending" || status === "Pending Review") {
        filter.$or = [{ status: { $in: ["Pending Review", "Pending"] } }, { bookingStatus: { $in: ["Pending Review", "Pending"] } }];
      } else {
        filter.$or = [{ status }, { bookingStatus: status }];
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { bookingId: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { primaryPhone: { $regex: q, $options: "i" } },
        { phone1: { $regex: q, $options: "i" } },
        { alternatePhone: { $regex: q, $options: "i" } },
        { serviceName: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
        { assignedEngineer: { $regex: q, $options: "i" } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const bookings = await ServiceBooking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching admin service bookings:", err);
    res.status(500).json({ message: "Failed to fetch service bookings.", error: err.message });
  }
});

// GET /api/services/bookings/:id - Admin: Fetch single service booking details
router.get("/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service booking details.", error: err.message });
  }
});

// PATCH /api/services/bookings/:id/status - Admin: Update status, assign engineer, and admin notes
router.patch("/bookings/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, bookingStatus, assignedEngineer, assignedTechnician, adminNotes, technicianNotes, cancellationReason } = req.body;

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }

    const newStatus = status || bookingStatus;
    const newEngineer = assignedEngineer || assignedTechnician;
    const newNotes = adminNotes !== undefined ? adminNotes : technicianNotes;

    if (newStatus && newStatus !== booking.status && newStatus !== booking.bookingStatus) {
      booking.status = newStatus;
      booking.bookingStatus = newStatus;

      let historyNote = `Status changed to ${newStatus}`;
      if (newStatus === "Cancelled" && cancellationReason) {
        historyNote += ` (Reason: ${cancellationReason})`;
      } else if (newNotes) {
        historyNote += ` - ${newNotes}`;
      }

      booking.statusHistory.push({
        status: newStatus,
        note: historyNote,
        updatedAt: new Date(),
      });
    }

    if (newEngineer !== undefined) {
      booking.assignedEngineer = newEngineer;
      booking.assignedTechnician = newEngineer;
    }

    if (newNotes !== undefined) {
      booking.adminNotes = newNotes;
      booking.technicianNotes = newNotes;
    }

    if (cancellationReason !== undefined) {
      booking.cancellationReason = cancellationReason;
    }

    await booking.save();

    res.json({
      success: true,
      booking,
      message: `Booking #${booking.bookingId} updated successfully!`,
    });
  } catch (err) {
    console.error("Error updating service booking status:", err);
    res.status(500).json({ message: "Failed to update booking status.", error: err.message });
  }
});

// PATCH /api/services/bookings/:id/cancel - User or Admin cancel service booking
router.patch("/bookings/:id/cancel", optionalAuth, async (req, res) => {
  try {
    const { reason, cancellationReason } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Service booking not found." });
    }

    if (booking.status === "Completed") {
      return res.status(400).json({ message: "Completed service bookings cannot be cancelled." });
    }

    const finalReason = cancellationReason || reason || "Cancelled by customer";
    booking.status = "Cancelled";
    booking.bookingStatus = "Cancelled";
    booking.cancellationReason = finalReason;
    booking.statusHistory.push({
      status: "Cancelled",
      note: finalReason,
      updatedAt: new Date(),
    });

    await booking.save();

    res.json({
      success: true,
      booking,
      message: `Service booking #${booking.bookingId} cancelled.`,
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
    res.json({ success: true, message: `Service booking #${booking.bookingId} deleted.` });
  } catch (err) {
    console.error("Error deleting service booking:", err);
    res.status(500).json({ message: "Failed to delete service booking.", error: err.message });
  }
});

export default router;
