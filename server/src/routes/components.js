import express from "express";
import PCComponent from "../models/PCComponent.js";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper to normalize catalog product categories into the 8 PC builder component categories
export function normalizeComponentCategory(category) {
  if (!category || typeof category !== "string") return null;
  const c = category.toLowerCase().trim().replace(/[-_]/g, " ");

  // 1. Processor (CPU)
  if (["processor", "processors", "cpu", "cpus", "central processing unit"].includes(c)) return "processor";
  // 2. Graphics Card (GPU)
  if (["gpu", "gpus", "graphics card", "graphics cards", "graphics", "video card", "graphic cards", "graphic card"].includes(c)) return "gpu";
  // 3. Motherboard
  if (["motherboard", "motherboards", "mobo", "mainboard", "mother board"].includes(c)) return "motherboard";
  // 4. Memory (RAM)
  if (["ram", "rams", "memory", "memory ram", "ddr4", "ddr5", "system memory"].includes(c)) return "ram";
  // 5. Storage
  if (["storage", "ssd", "ssds", "hdd", "hdds", "hard drive", "hard disk", "nvme", "m.2"].includes(c)) return "storage";
  // 6. Power Supply (PSU)
  if (["psu", "power supply", "power supplies", "smps", "power supply unit"].includes(c)) return "psu";
  // 7. CPU Cooler / Cooling
  if (["cooling", "cooler", "coolers", "cpu cooler", "liquid cooler", "aio", "case fan", "cpu fan", "liquid cooling"].includes(c)) return "cooling";
  // 8. Cabinet / Case
  if (["case", "cases", "cabinet", "cabinets", "chassis", "tower", "pc case"].includes(c)) return "case";

  // Substring checks
  if (c.includes("cpu") || c.includes("processor")) return "processor";
  if (c.includes("gpu") || c.includes("graphic") || c.includes("video card") || c.includes("rtx") || c.includes("gtx") || c.includes("geforce") || c.includes("radeon")) return "gpu";
  if (c.includes("motherboard") || c.includes("mobo") || c.includes("mainboard")) return "motherboard";
  if (c.includes("ram") || c.includes("memory") || c.includes("ddr")) return "ram";
  if (c.includes("storage") || c.includes("ssd") || c.includes("hdd") || c.includes("nvme") || c.includes("hard drive")) return "storage";
  if (c.includes("psu") || c.includes("power supply") || c.includes("smps")) return "psu";
  if (c.includes("cooler") || c.includes("cooling") || c.includes("aio") || c.includes("liquid")) return "cooling";
  if (c.includes("case") || c.includes("cabinet") || c.includes("chassis") || c.includes("tower")) return "case";

  return null;
}

// GET /api/components - Fetch all parts grouped by category (merges PCComponent and Product collections)
router.get("/", async (_req, res) => {
  try {
    const [components, products] = await Promise.all([
      PCComponent.find().lean(),
      Product.find().lean()
    ]);

    const grouped = {
      processor: [],
      motherboard: [],
      ram: [],
      storage: [],
      gpu: [],
      psu: [],
      cooling: [],
      case: []
    };

    const seenIds = new Set();
    const seenNames = new Set();

    // 1. Add dedicated PCComponent documents first
    for (const c of components) {
      if (grouped[c.category]) {
        grouped[c.category].push({
          id: c._id.toString(),
          name: c.name,
          price: c.price,
          brand: c.brand || "",
          specs: c.specs || "",
          category: c.category,
          source: "component"
        });
        seenIds.add(c._id.toString());
        seenNames.add(`${c.category}:${c.name.toLowerCase().trim()}`);
      }
    }

    // 2. Add products from the Product collection whose category matches
    for (const p of products) {
      const pId = p._id.toString();
      if (seenIds.has(pId)) continue;

      const normCategory = normalizeComponentCategory(p.category);
      if (!normCategory || !grouped[normCategory]) continue;

      const nameKey = `${normCategory}:${p.name.toLowerCase().trim()}`;
      if (seenNames.has(nameKey)) continue;

      let specsText = "";
      if (p.specs) {
        if (typeof p.specs.entries === "function") {
          specsText = Array.from(p.specs.entries()).map(([k, v]) => `${k}: ${v}`).join(", ");
        } else if (typeof p.specs === "object") {
          specsText = Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(", ");
        }
      }
      if (!specsText && p.description) {
        specsText = p.description.slice(0, 80);
      }

      grouped[normCategory].push({
        id: pId,
        name: p.name,
        price: p.price,
        brand: p.brand || "",
        specs: specsText,
        category: normCategory,
        image: p.image || "",
        source: "product"
      });

      seenIds.add(pId);
      seenNames.add(nameKey);
    }

    res.json(grouped);
  } catch (err) {
    console.error("GET /api/components error:", err.message);
    res.status(500).json({ message: "Server error fetching components.", error: err.message });
  }
});

// POST /api/components (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const normCategory = normalizeComponentCategory(req.body.category) || req.body.category;
    const component = await PCComponent.create({
      ...req.body,
      category: normCategory
    });
    res.status(201).json(component);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// PUT /api/components/:id (admin only - update pricing and specs)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    let component = await PCComponent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!component) {
      // Check if it's a catalog Product
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...(req.body.name ? { name: req.body.name } : {}),
          ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
          ...(req.body.specs ? { description: req.body.specs } : {}),
        },
        { new: true }
      );
      if (product) {
        return res.json({
          id: product._id,
          name: product.name,
          price: product.price,
          brand: product.brand,
          specs: req.body.specs || product.description,
          category: req.body.category || product.category,
        });
      }
      return res.status(404).json({ message: "Component not found." });
    }
    res.json(component);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// DELETE /api/components/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    let component = await PCComponent.findByIdAndDelete(req.params.id);
    if (!component) {
      const prod = await Product.findByIdAndDelete(req.params.id);
      if (prod) {
        return res.json({ message: "Component deleted from catalog." });
      }
      return res.status(404).json({ message: "Component not found." });
    }
    res.json({ message: "Component deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;
