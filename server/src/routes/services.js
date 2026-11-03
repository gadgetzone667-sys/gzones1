import express from "express";
import Service from "../models/Service.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const defaultServices = [
  {
    name: "Custom PC Assembly",
    price: "From ₹1,999",
    icon: "Wrench",
    description: "Professional assembly of your custom PC build with precision cable management and thorough stress testing.",
    features: [
      "Expert component assembly",
      "Clean cable routing & management",
      "48-hour thermal & stress test",
      "1-year assembly warranty",
    ],
  },
  {
    name: "CCTV Installation",
    price: "From ₹3,999",
    icon: "Camera",
    description: "Complete security surveillance setup for homes and commercial businesses with remote live monitoring capabilities.",
    features: [
      "On-site security survey",
      "Full HD & Night Vision cameras",
      "Mobile remote access configuration",
      "24/7 continuous recording setup",
    ],
  },
  {
    name: "Network Setup",
    price: "From ₹2,499",
    icon: "Wifi",
    description: "Professional network infrastructure and high-speed wireless setup tailored for homes, studios, and modern offices.",
    features: [
      "Custom network topology design",
      "Router & switch configuration",
      "Enterprise security protocols",
      "Bandwidth & latency optimization",
    ],
  },
  {
    name: "Laptop Repair",
    price: "From ₹999",
    icon: "Laptop",
    description: "Certified hardware and chip-level laptop diagnosis and repair for all leading global brands and models.",
    features: [
      "Comprehensive free diagnosis",
      "Original screen replacement",
      "Battery & charging port fix",
      "Safe data backup & transfer",
    ],
  },
  {
    name: "Data Recovery",
    price: "From ₹1,499",
    icon: "Database",
    description: "Advanced data recovery solutions from damaged hard drives, solid-state drives, corrupted storage, and flash media.",
    features: [
      "Complimentary storage evaluation",
      "Clean-room recovery procedures",
      "All file systems & media types",
      "100% confidential data handling",
    ],
  },
  {
    name: "Printer Repair & Service",
    price: "From ₹799",
    icon: "Printer",
    description: "Comprehensive printer troubleshooting, toner/cartridge refilling, printhead cleaning, and mechanical servicing.",
    features: [
      "LaserJet & Inkjet diagnosis",
      "Toner & cartridge refills",
      "Paper feed & roller mechanism fix",
      "Network printer configuration",
    ],
  },
];

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

// GET /api/services - Fetch all services (auto-seeds defaults if empty)
router.get("/", async (_req, res) => {
  try {
    let services = await Service.find();
    if (!services || services.length === 0) {
      services = await Service.insertMany(defaultServices);
    }
    res.json(
      services.map((s) => {
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
