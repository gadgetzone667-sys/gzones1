import express from "express";
import PCComponent from "../models/PCComponent.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/components - Fetch all parts grouped by category
router.get("/", async (_req, res) => {
  try {
    const components = await PCComponent.find();
    
    const grouped = components.reduce((acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push({
        id: c._id,
        name: c.name,
        price: c.price,
        brand: c.brand,
        specs: c.specs,
        category: c.category
      });
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching components.", error: err.message });
  }
});

// POST /api/components (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const component = await PCComponent.create(req.body);
    res.status(201).json(component);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// PUT /api/components/:id (admin only - update pricing and specs)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const component = await PCComponent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!component) return res.status(404).json({ message: "Component not found." });
    res.json(component);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// DELETE /api/components/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const component = await PCComponent.findByIdAndDelete(req.params.id);
    if (!component) return res.status(404).json({ message: "Component not found." });
    res.json({ message: "Component deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;
