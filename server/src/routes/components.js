import express from "express";
import PCComponent from "../models/PCComponent.js";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

export const standardComponentsSeed = [
  // Processors
  { category: "processor", name: "AMD Ryzen 7 7800X3D", price: 38999, brand: "AMD", specs: "8 Cores, 16 Threads, up to 5.0GHz, 104MB Cache" },
  { category: "processor", name: "Intel Core i7-14700K", price: 37499, brand: "Intel", specs: "20 Cores (8P+12E), 28 Threads, up to 5.6GHz" },
  { category: "processor", name: "AMD Ryzen 5 7600X", price: 19999, brand: "AMD", specs: "6 Cores, 12 Threads, up to 5.3GHz" },
  { category: "processor", name: "Intel Core i5-14400F", price: 14999, brand: "Intel", specs: "10 Cores (6P+4E), 16 Threads, up to 4.7GHz" },

  // Motherboards
  { category: "motherboard", name: "MSI B760M Gaming Plus WiFi", price: 14499, brand: "MSI", specs: "LGA1700, DDR5, PCIe 4.0, Wi-Fi 6E" },
  { category: "motherboard", name: "ASUS TUF Gaming B650-Plus WiFi", price: 18999, brand: "ASUS", specs: "AM5, DDR5, PCIe 5.0 M.2, Wi-Fi 6" },
  { category: "motherboard", name: "Gigabyte B650M DS3H", price: 11499, brand: "Gigabyte", specs: "AM5, DDR5, Dual M.2, 2.5G LAN" },
  { category: "motherboard", name: "ASRock B760 Pro RS", price: 13999, brand: "ASRock", specs: "LGA1700, DDR5, 3x M.2, Dragon 2.5G LAN" },

  // RAM
  { category: "ram", name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", price: 9499, brand: "Corsair", specs: "CL30, Intel XMP & AMD EXPO" },
  { category: "ram", name: "G.Skill Ripjaws S5 32GB (2x16GB) DDR5 5600MHz", price: 8299, brand: "G.Skill", specs: "CL36, Low-Profile Heatspreader" },
  { category: "ram", name: "Kingston Fury Beast 16GB (1x16GB) DDR5 5200MHz", price: 4499, brand: "Kingston", specs: "Plug N Play Automatic Overclocking" },

  // Storage
  { category: "storage", name: "Samsung 980 Pro 1TB NVMe Gen4 SSD", price: 8499, brand: "Samsung", specs: "Up to 7000 MB/s Read, 5000 MB/s Write" },
  { category: "storage", name: "Crucial P3 Plus 1TB PCIe 4.0 3D NAND NVMe", price: 5499, brand: "Crucial", specs: "Up to 5000 MB/s Read, 4200 MB/s Write" },
  { category: "storage", name: "Western Digital WD Black SN850X 2TB", price: 14999, brand: "Western Digital", specs: "Up to 7300 MB/s Read, Gaming Mode 2.0" },
  { category: "storage", name: "Seagate Barracuda 2TB 3.5-inch 7200 RPM HDD", price: 4899, brand: "Seagate", specs: "SATA 6Gb/s, 256MB Cache" },

  // GPU
  { category: "gpu", name: "NVIDIA GeForce RTX 4070 Super 12GB", price: 59999, brand: "NVIDIA", specs: "Ada Lovelace, DLSS 3, Ray Tracing" },
  { category: "gpu", name: "NVIDIA GeForce RTX 4060 Ti 8GB", price: 36999, brand: "NVIDIA", specs: "DLSS 3, 4352 CUDA Cores, 160W TDP" },
  { category: "gpu", name: "AMD Radeon RX 7800 XT 16GB", price: 51999, brand: "AMD", specs: "RDNA 3, 16GB GDDR6, FSR 3 Support" },
  { category: "gpu", name: "NVIDIA GeForce RTX 3060 12GB", price: 24999, brand: "NVIDIA", specs: "12GB GDDR6, Ray Tracing, Ampere" },

  // PSU
  { category: "psu", name: "Corsair RM750e 750W 80+ Gold Fully Modular", price: 8999, brand: "Corsair", specs: "ATX 3.0 & PCIe 5.0 Compliant" },
  { category: "psu", name: "Deepcool PM750D 750W 80+ Gold Non-Modular", price: 5999, brand: "Deepcool", specs: "Active PFC, Flat Cables, Japanese Caps" },
  { category: "psu", name: "Cooler Master MWE 650 V2 80+ Bronze", price: 4999, brand: "Cooler Master", specs: "650W, HDB Fan, DC-to-DC Circuit" },

  // Cooling
  { category: "cooling", name: "Deepcool AK620 High-Performance Dual-Tower Air Cooler", price: 5499, brand: "Deepcool", specs: "6 Heatpipes, 2x 120mm PWM Fans, 260W TDP" },
  { category: "cooling", name: "Thermalright Peerless Assassin 120 SE", price: 3799, brand: "Thermalright", specs: "Dual Tower, 6 Heatpipes, AGHP Gen 3" },
  { category: "cooling", name: "Deepcool LE520 240mm ARGB Liquid Cooler", price: 5999, brand: "Deepcool", specs: "240mm Radiator, Anti-Leak Tech, ARGB Fans" },
  { category: "cooling", name: "NZXT Kraken 240 RGB Liquid Cooler", price: 12499, brand: "NZXT", specs: "1.54-inch Square LCD, High Static Pressure Fans" },

  // Case
  { category: "case", name: "Ant Esports ICE-112 Mid-Tower Cabinet", price: 3499, brand: "Ant Esports", specs: "4x 120mm Rainbow Fans, Tempered Glass" },
  { category: "case", name: "Deepcool CC560 V2 High Airflow Mid-Tower", price: 4499, brand: "Deepcool", specs: "4x Pre-installed Fans, Mesh Front, Tempered Glass" },
  { category: "case", name: "NZXT H5 Flow Compact ATX Mid-Tower", price: 7999, brand: "NZXT", specs: "Dedicated GPU Fan, Perforated Front, Cable Bar" },
  { category: "case", name: "Lian Li O11 Dynamic Mini Snow White", price: 8999, brand: "Lian Li", specs: "Dual Chamber, Modular Backplate, Panoramic Glass" },
];

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

    // 3. Auto-fallback for any empty category so builder is 100% usable
    for (const seed of standardComponentsSeed) {
      if (grouped[seed.category] && grouped[seed.category].length === 0) {
        const seedId = `seed-${seed.category}-${seed.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        grouped[seed.category].push({
          id: seedId,
          name: seed.name,
          price: seed.price,
          brand: seed.brand || "",
          specs: seed.specs || "",
          category: seed.category,
          source: "standard"
        });
      }
    }

    res.json(grouped);
  } catch (err) {
    console.error("GET /api/components error:", err.message);
    res.status(500).json({ message: "Server error fetching components.", error: err.message });
  }
});

// POST /api/components/seed - Seed standard component catalog into database (admin only)
router.post("/seed", requireAdmin, async (_req, res) => {
  try {
    let addedCount = 0;
    for (const comp of standardComponentsSeed) {
      const existing = await PCComponent.findOne({
        category: comp.category,
        name: comp.name
      });
      if (!existing) {
        await PCComponent.create(comp);
        addedCount++;
      }
    }
    res.json({ success: true, message: `Populated ${addedCount} standard components across all 8 hardware categories.` });
  } catch (err) {
    res.status(500).json({ message: "Server error seeding components.", error: err.message });
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
