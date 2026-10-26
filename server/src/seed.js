import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Product from "./models/Product.js";
import Review from "./models/Review.js";
import PCComponent from "./models/PCComponent.js";
import Service from "./models/Service.js";

const products = [
  {
    name: "AMD Ryzen 9 7950X", category: "processors", price: 549, originalPrice: 699,
    image: "/products/amd_ryzen_7950x.png", rating: 4.8, reviewCount: 234, brand: "AMD",
    description: "Experience elite performance with the 16-core, 32-thread AMD Ryzen 9 7950X unlocked desktop processor. Built on the cutting-edge Zen 4 architecture.",
    stock: 15, featured: true,
    specs: { Cores: "16", Threads: "32", "Base Clock": "4.5 GHz", "Boost Clock": "5.7 GHz" },
  },
  {
    name: "NVIDIA RTX 4090", category: "graphics-cards", price: 1599,
    image: "/products/nvidia_rtx_4090.png", rating: 4.9, reviewCount: 189, brand: "NVIDIA",
    description: "The ultimate GeForce GPU powered by Ada Lovelace architecture with 24GB GDDR6X and DLSS 3.",
    stock: 8, featured: true,
    specs: { VRAM: "24GB GDDR6X", Cores: "16384 CUDA", "Boost Clock": "2.52 GHz" },
  },
  {
    name: "ASUS ROG Strix B650E-F", category: "motherboards", price: 329,
    image: "/products/asus_b650e_f.png", rating: 4.7, reviewCount: 98, brand: "ASUS",
    description: "AM5 ATX motherboard with PCIe 5.0, DDR5 support, and WiFi 6E.",
    stock: 22, featured: true,
  },
  {
    name: "Corsair Vengeance DDR5 32GB", category: "memory", price: 119, originalPrice: 149,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.6, reviewCount: 312, brand: "Corsair",
    description: "32GB (2x16GB) DDR5 kit at 5600MHz with C36 timings.",
    stock: 50, featured: true,
  },
  {
    name: "Samsung 990 Pro 2TB NVMe", category: "storage", price: 179, originalPrice: 229,
    image: "/products/samsung_990_pro.png", rating: 4.8, reviewCount: 456, brand: "Samsung",
    description: "PCIe 4.0 NVMe M.2 SSD with sequential read up to 7,450 MB/s.",
    stock: 35, featured: true,
    specs: { Capacity: "2TB", Interface: "PCIe 4.0 x4", "Read Speed": "7,450 MB/s", "Write Speed": "6,900 MB/s" },
  },
  {
    name: "Intel Core i9-14900K", category: "processors", price: 589,
    image: "/products/intel_i9_14900k.png", rating: 4.7, reviewCount: 167, brand: "Intel",
    description: "24-core (8P+16E) unlocked desktop processor with 6.0GHz max turbo.",
    stock: 12,
    specs: { Cores: "24 (8P+16E)", Threads: "32", "Max Turbo": "6.0 GHz", "Base Power": "125 W" },
  },
  {
    name: "NVIDIA RTX 4070 Ti Super", category: "graphics-cards", price: 799,
    image: "/products/rtx_4070_ti.png", rating: 4.6, reviewCount: 145, brand: "NVIDIA",
    description: "Great 1440p gaming GPU with DLSS 3 support.",
    stock: 20,
    specs: { VRAM: "16GB GDDR6X", Cores: "8448 CUDA", "Boost Clock": "2.61 GHz" },
  },
  {
    name: "Logitech G Pro X Superlight", category: "peripherals", price: 159,
    image: "/products/logitech_g_pro.png", rating: 4.9, reviewCount: 890, brand: "Logitech",
    description: "Ultra-lightweight wireless gaming mouse with HERO 25K sensor.",
    stock: 100, featured: true,
    specs: { Weight: "< 63g", Sensor: "HERO 25K", DPI: "25,600", Connectivity: "LIGHTSPEED Wireless" },
  },
  {
    name: "Corsair RM1000x PSU", category: "peripherals", price: 189,
    image: "/products/corsair_psu.png", rating: 4.7, reviewCount: 223, brand: "Corsair",
    description: "1000W 80+ Gold fully modular ATX power supply.",
    stock: 30,
    specs: { Wattage: "1000 W", Efficiency: "80 PLUS Gold", Modular: "Fully Modular", FormFactor: "ATX" },
  },
  {
    name: "NZXT H7 Flow", category: "peripherals", price: 129,
    image: "/products/nzxt_case.png", rating: 4.5, reviewCount: 178, brand: "NZXT",
    description: "Premium mid-tower ATX case with high airflow.",
    stock: 25,
    specs: { FormFactor: "Mid-Tower", MotherboardSupport: "Mini-ITX, Micro-ATX, ATX", IncludedFans: "2x 120mm Quiet Airflow" },
  },
  {
    name: "AMD Ryzen 7 7800X3D", category: "processors", price: 449,
    image: "/products/ryzen_7800x3d.png", rating: 4.9, reviewCount: 534, brand: "AMD",
    description: "The ultimate gaming processor with 3D V-Cache technology.",
    stock: 18,
    specs: { Cores: "8", Threads: "16", "L3 Cache": "96 MB (3D V-Cache)", "Max Boost": "5.0 GHz" },
  },
  {
    name: "WD Black SN850X 1TB", category: "storage", price: 89,
    image: "https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 678, brand: "Western Digital",
    description: "PCIe Gen4 NVMe SSD for gaming and content creation.",
    stock: 60,
    specs: { Capacity: "1TB", Interface: "PCIe 4.0 x4", "Seq Read": "7,300 MB/s", "Seq Write": "6,300 MB/s" },
  },
  {
    name: "Hikvision 4MP Turret Camera", category: "cameras", price: 89,
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 156, brand: "Hikvision",
    description: "High-quality surveillance with 4MP resolution and AcuSense tech.",
    stock: 50, featured: true,
    specs: { Resolution: "4MP", Lens: "2.8mm", Privacy: "IP67" }
  },
  {
    name: "TP-Link Tapo C200", category: "cameras", price: 35, originalPrice: 45,
    image: "https://images.unsplash.com/photo-1524311583145-d4520309995c?q=80&w=1000&auto=format&fit=crop", rating: 4.6, reviewCount: 2450, brand: "TP-Link",
    description: "Pan/Tilt home security Wi-Fi camera with 1080p HD video.",
    stock: 120,
    specs: { Resolution: "1080p", View: "360° Pan", Audio: "Two-Way" }
  },
  {
    name: "Dahua 8-Channel NVR", category: "cameras", price: 219,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 42, brand: "Dahua",
    description: "Cost-effective, high-performance network video recorder.",
    stock: 15,
    specs: { Channels: "8", MaxResolution: "8MP", Bandwidth: "80Mbps" }
  },
  {
    name: "Reolink Solar PTZ Camera", category: "cameras", price: 189, originalPrice: 209,
    image: "https://images.unsplash.com/photo-1590012357758-294794e772cc?q=80&w=1000&auto=format&fit=crop", rating: 4.5, reviewCount: 178, brand: "Reolink",
    description: "Wire-free security powered by solar panel with 2K 4MP Super HD.",
    stock: 25, featured: true,
    specs: { Resolution: "2K", Power: "Solar", Connection: "Dual-Band WiFi" }
  },
  {
    name: "Arlo Pro 5S 2K Wireless", category: "cameras", price: 249,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 92, brand: "Arlo",
    description: "Professional-grade 2K HDR wireless security camera.",
    stock: 15,
    specs: { Resolution: "2K HDR", FOV: "160°", Audio: "Noise Canceling" }
  },
  {
    name: "Wyze Cam v3 Pro", category: "cameras", price: 59,
    image: "https://images.unsplash.com/photo-1524311583145-d4520309995c?q=80&w=1000&auto=format&fit=crop", rating: 4.4, reviewCount: 520, brand: "Wyze",
    description: "Compact indoor/outdoor camera with 2K resolution & built-in spotlight.",
    stock: 80,
    specs: { Resolution: "2K", Protection: "IP65", NightVision: "Starlight" }
  },
  {
    name: "Ring Spotlight Cam Plus", category: "cameras", price: 169, originalPrice: 199,
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=1000&auto=format&fit=crop", rating: 4.6, reviewCount: 312, brand: "Ring",
    description: "Versatile outdoor security camera with integrated LED lights.",
    stock: 22,
    specs: { Resolution: "1080p HD", Lights: "LED", Siren: "Remote-Activated" }
  },
  {
    name: "Logitech Circle View", category: "cameras", price: 159,
    image: "https://images.unsplash.com/photo-1590012357758-294794e772cc?q=80&w=1000&auto=format&fit=crop", rating: 4.3, reviewCount: 45, brand: "Logitech",
    description: "Premium HomeKit-enabled 1080p HD security camera.",
    stock: 10,
    specs: { Resolution: "1080p", FOV: "180°", Platform: "HomeKit" }
  },
  {
    name: "Intel Core i7-14700K", category: "processors", price: 399, originalPrice: 429,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 142, brand: "Intel",
    description: "20-core (8P+12E) processor with 5.6GHz max boost for gaming and creation.",
    stock: 25, featured: true,
    specs: { Cores: "20 (8P+12E)", Threads: "28", "Max Turbo": "5.6 GHz" }
  },
  {
    name: "AMD Ryzen 5 7600X", category: "processors", price: 219, originalPrice: 249,
    image: "/products/amd_ryzen_7950x.png", rating: 4.7, reviewCount: 290, brand: "AMD",
    description: "High-value 6-core gaming processor built on Zen 4 architecture.",
    stock: 35,
    specs: { Cores: "6", Threads: "12", "Boost Clock": "5.3 GHz" }
  },
  {
    name: "AMD Radeon RX 7800 XT", category: "graphics-cards", price: 499, originalPrice: 529,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 210, brand: "AMD",
    description: "Immersive 1440p gaming card with 16GB GDDR6 memory.",
    stock: 18, featured: true,
    specs: { VRAM: "16GB GDDR6", "Stream Processors": "3840" }
  },
  {
    name: "NVIDIA RTX 4060 Ti 16GB", category: "graphics-cards", price: 449,
    image: "/products/rtx_4070_ti.png", rating: 4.6, reviewCount: 175, brand: "NVIDIA",
    description: "16GB VRAM GPU with DLSS 3 Frame Generation technology.",
    stock: 22,
    specs: { VRAM: "16GB GDDR6", Cores: "4352 CUDA" }
  },
  {
    name: "Gigabyte Z790 AORUS Elite AX", category: "motherboards", price: 259, originalPrice: 289,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 118, brand: "Gigabyte",
    description: "Intel Z790 ATX motherboard with DDR5 XMP 7600MHz+ & Wi-Fi 6E.",
    stock: 14,
    specs: { Socket: "LGA 1700", Chipset: "Intel Z790", Memory: "DDR5" }
  },
  {
    name: "ASRock B650 Steel Legend WiFi", category: "motherboards", price: 219,
    image: "/products/asus_b650e_f.png", rating: 4.6, reviewCount: 88, brand: "ASRock",
    description: "AM5 motherboard with 14+2+1 power design and PCIe 5.0 M.2.",
    stock: 19,
    specs: { Socket: "AM5", Chipset: "AMD B650", WiFi: "Wi-Fi 6E" }
  },
  {
    name: "G.Skill Trident Z5 RGB 32GB DDR5", category: "memory", price: 139, originalPrice: 159,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.9, reviewCount: 340, brand: "G.Skill",
    description: "Flagship 32GB (2x16GB) 6000MHz CL30 DDR5 RGB memory kit.",
    stock: 45, featured: true,
    specs: { Capacity: "32GB (2x16GB)", Speed: "6000MHz", Latency: "CL30" }
  },
  {
    name: "Kingston Fury Beast 64GB DDR5", category: "memory", price: 219,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.7, reviewCount: 165, brand: "Kingston",
    description: "High-capacity 64GB (2x32GB) DDR5 memory for rendering & multitasking.",
    stock: 28,
    specs: { Capacity: "64GB (2x32GB)", Speed: "5200MHz" }
  },
  {
    name: "Crucial T700 2TB PCIe 5.0 NVMe", category: "storage", price: 279, originalPrice: 319,
    image: "/products/samsung_990_pro.png", rating: 4.9, reviewCount: 104, brand: "Crucial",
    description: "PCIe 5.0 NVMe SSD with speeds up to 12,400 MB/s.",
    stock: 15, featured: true,
    specs: { Capacity: "2TB", Interface: "PCIe 5.0 x4", "Read Speed": "12,400 MB/s" }
  },
  {
    name: "Seagate Barracuda 4TB HDD", category: "storage", price: 79,
    image: "https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=1000&auto=format&fit=crop", rating: 4.5, reviewCount: 512, brand: "Seagate",
    description: "Massive 4TB desktop hard drive for media and game backups.",
    stock: 75,
    specs: { Capacity: "4TB", Interface: "SATA 6Gb/s" }
  },
  {
    name: "ASUS ROG Swift 32\" 4K OLED", category: "peripherals", price: 1299, originalPrice: 1399,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop", rating: 4.9, reviewCount: 76, brand: "ASUS",
    description: "32-inch 4K QD-OLED gaming monitor with 240Hz & 0.03ms response time.",
    stock: 8, featured: true,
    specs: { Resolution: "4K UHD", RefreshRate: "240Hz", Panel: "QD-OLED" }
  },
  {
    name: "Keychron Q1 Pro Wireless", category: "peripherals", price: 199,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 204, brand: "Keychron",
    description: "75% QMK/VIA wireless mechanical keyboard in CNC aluminum body.",
    stock: 30,
    specs: { Layout: "75%", Connection: "Bluetooth 5.1 / Wired" }
  }
];

const components = [
  { category: "processor", name: "AMD Ryzen 9 7950X", price: 549, brand: "AMD", specs: "16C/32T, 5.7GHz Boost" },
  { category: "processor", name: "Intel Core i9-14900K", price: 589, brand: "Intel", specs: "24C/32T, 6.0GHz Boost" },
  { category: "processor", name: "AMD Ryzen 7 7800X3D", price: 449, brand: "AMD", specs: "8C/16T, 3D V-Cache" },
  { category: "processor", name: "Intel Core i7-14700K", price: 399, brand: "Intel", specs: "20C/28T, 5.6GHz Boost" },
  { category: "motherboard", name: "ASUS ROG Strix B650E-F", price: 329, brand: "ASUS", specs: "AM5, DDR5, PCIe 5.0" },
  { category: "motherboard", name: "MSI MEG Z790 ACE", price: 499, brand: "MSI", specs: "LGA1700, DDR5, WiFi 7" },
  { category: "ram", name: "Corsair Vengeance DDR5 32GB", price: 119, brand: "Corsair", specs: "2x16GB, 5600MHz, C36" },
  { category: "ram", name: "G.Skill Trident Z5 RGB 32GB", price: 139, brand: "G.Skill", specs: "2x16GB, 6000MHz, C30" },
  { category: "storage", name: "Samsung 990 Pro 2TB", price: 179, brand: "Samsung", specs: "NVMe Gen4, 7450MB/s" },
  { category: "storage", name: "WD Black SN850X 1TB", price: 89, brand: "WD", specs: "NVMe Gen4, 7300MB/s" },
  { category: "gpu", name: "NVIDIA RTX 4090", price: 1599, brand: "NVIDIA", specs: "24GB GDDR6X, DLSS 3" },
  { category: "gpu", name: "NVIDIA RTX 4070 Ti Super", price: 799, brand: "NVIDIA", specs: "16GB GDDR6X, DLSS 3" },
  { category: "psu", name: "Corsair RM1000x", price: 189, brand: "Corsair", specs: "1000W, 80+ Gold, Modular" },
  { category: "cooling", name: "NZXT Kraken X73", price: 179, brand: "NZXT", specs: "360mm AIO, LCD Display" },
  { category: "case", name: "NZXT H7 Flow", price: 129, brand: "NZXT", specs: "Mid-Tower, High Airflow" },
];

const services = [
  {
    name: "Custom PC Assembly", price: "From ₹1,999",
    icon: "Wrench",
    description: "Professional assembly of your custom PC build with cable management and stress testing.",
    features: ["Expert assembly", "Cable management", "48-hour stress test", "1-year warranty"],
  },
  {
    name: "CCTV Installation", price: "From ₹3,999",
    icon: "Camera",
    description: "Complete CCTV setup for home or business with remote monitoring capabilities.",
    features: ["Site survey", "HD cameras", "Remote access setup", "24/7 recording"],
  },
  {
    name: "Network Setup", price: "From ₹2,499",
    icon: "Wifi",
    description: "Professional network infrastructure setup for homes and offices.",
    features: ["Network design", "Router configuration", "Security setup", "Speed optimization"],
  },
  {
    name: "Laptop Repair", price: "From ₹999",
    icon: "Laptop",
    description: "Expert laptop diagnosis and repair for all brands and models.",
    features: ["Free diagnosis", "Screen replacement", "Battery replacement", "Data backup"],
  },
  {
    name: "Data Recovery", price: "From ₹1,499",
    icon: "Database",
    description: "Professional data recovery from damaged drives, SSDs, and storage media.",
    features: ["Free evaluation", "Clean room recovery", "All media types", "Confidential handling"],
  },
  {
    name: "Printer Repair & Service", price: "From ₹799",
    icon: "Printer",
    description: "Comprehensive printer diagnosis, cartridge refill, head cleaning, and hardware repair for laser and inkjet printers.",
    features: ["Inkjet & Laserjet repair", "Toner & cartridge refill", "Paper jam & roller fix", "Network printer setup"],
  },
];

const users = [
  { email: "admin@gzones.in", password: "Vijay@2223", isAdmin: true },
  { email: "vijay", password: "Vijay@2223", isAdmin: true },
  { email: "vijay@techspare.com", password: "Vijay@2223", isAdmin: true },
  { email: "admin@techspare.com", password: "Vijay@2223", isAdmin: true },
  { email: "user@example.com", password: "user123", isAdmin: false },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await PCComponent.deleteMany({});
    await Service.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Seed users
    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      await User.create({ email: u.email, passwordHash, isAdmin: u.isAdmin, lastLogin: new Date() });
    }
    console.log(`👤 Seeded ${users.length} users`);

    // Seed products
    await Product.insertMany(products);
    console.log(`📦 Seeded ${products.length} products`);

    // Seed components
    await PCComponent.insertMany(components);
    console.log(`🔧 Seeded ${components.length} PC components`);

    // Seed services
    await Service.insertMany(services);
    console.log(`🛠️  Seeded ${services.length} services`);

    console.log("\n✨ Seed complete!");
    console.log("   Demo accounts:");
    console.log("   Admin  → admin@gzones.in / Vijay@2223");
    console.log("   User   → user@example.com / user123");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
