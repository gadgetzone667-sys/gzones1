import express from "express";
import Service from "../models/Service.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/services - Fetch all services
router.get("/", async (_req, res) => {
  try {
    const services = await Service.find();
    res.json(services.map(s => ({
      id: s._id,
      name: s.name,
      description: s.description,
      price: s.price,
      icon: s.icon,
      features: s.features
    })));
  } catch (err) {
    res.status(500).json({ message: "Server error fetching services.", error: err.message });
  }
});

// POST /api/services (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description, price, icon, features } = req.body;
    const service = await Service.create({
      name,
      description,
      price,
      icon: icon || "Wrench",
      features: features || [],
    });
    res.status(201).json({
      id: service._id,
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
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({
      id: service._id,
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
