import express from "express";
import Service from "../models/Service.js";
import { requireAdmin } from "../middleware/auth.js";

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

// GET /api/services - Fetch all services
router.get("/", async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(
      (services || []).map((s) => {
        let features = (Array.isArray(s.features) ? s.features : []).filter(Boolean);
        let desc = s.description || "";

        // Normalize legacy entries that had features appended to the description
        if (features.length === 0 && desc.includes("Expert assembly")) {
          const parts = desc.split("Expert assembly");
          desc = parts[0].trim();
          features = [
            "Expert component assembly",
            "Clean cable routing & management",
            "48-hour thermal & stress test",
            "1-year assembly warranty",
          ];
        }

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

export default router;
