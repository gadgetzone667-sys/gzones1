export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  brand: string;
  description: string;
  stock: number;
  featured?: boolean;
  specs?: Record<string, string>;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
  features: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  productId?: string;
}

export interface PCComponent {
  id: string;
  category: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
}

export const categories = [
  { id: "processors", name: "Processors", icon: "Cpu", count: 24 },
  { id: "graphics-cards", name: "Graphics Cards", icon: "Monitor", count: 18 },
  { id: "motherboards", name: "Motherboards", icon: "CircuitBoard", count: 15 },
  { id: "memory", name: "Memory (RAM)", icon: "MemoryStick", count: 32 },
  { id: "storage", name: "Storage", icon: "HardDrive", count: 28 },
  { id: "peripherals", name: "Peripherals", icon: "Keyboard", count: 45 },
  { id: "cameras", name: "Cameras", icon: "Camera", count: 8 },
];

export const products: Product[] = [
  {
    id: "1", name: "AMD Ryzen 9 7950X", category: "processors", price: 549, originalPrice: 699,
    image: "/products/amd_ryzen_7950x.png", rating: 4.8, reviewCount: 234, brand: "AMD",
    description: "Experience elite performance with the 16-core, 32-thread AMD Ryzen 9 7950X unlocked desktop processor. Built on the cutting-edge Zen 4 architecture, this CPU is engineered for gamers, creators, and enthusiasts who demand uncompromising speed and multitasking capabilities. Features PCIe 5.0 support, DDR5 memory compatibility, and a massive 64MB L3 cache. Tackle intense rendering, 4K gaming, and heavy workloads seamlessly.",
    stock: 15, featured: true,
    specs: { Cores: "16", Threads: "32", "Base Clock": "4.5 GHz", "Boost Clock": "5.7 GHz" },
  },
  {
    id: "2", name: "NVIDIA RTX 4090", category: "graphics-cards", price: 1599,
    image: "/products/nvidia_rtx_4090.png", rating: 4.9, reviewCount: 189, brand: "NVIDIA",
    description: "The ultimate GeForce GPU. The NVIDIA RTX 4090 brings a massive leap in performance, efficiency, and AI-powered graphics. Powered by the ultra-efficient Ada Lovelace architecture, you can experience ultra-high-performance gaming, incredibly detailed virtual worlds, unprecedented productivity, and new ways to create. With 24GB of G6X memory, DLSS 3 frame generation, and next-gen ray tracing, this is the definitive graphics card for the uncompromising user.",
    stock: 8, featured: true,
    specs: { VRAM: "24GB GDDR6X", Cores: "16384 CUDA", "Boost Clock": "2.52 GHz" },
  },
  {
    id: "3", name: "ASUS ROG Strix B650E-F", category: "motherboards", price: 329,
    image: "/products/asus_b650e_f.png", rating: 4.7, reviewCount: 98, brand: "ASUS",
    description: "The ASUS ROG Strix B650E-F Gaming WiFi Motherboard offers incredible power delivery, comprehensive cooling solutions, and the latest connectivity. Geared for AMD AM5 processors, it sets the foundation for your next dream build. Featuring PCIe 5.0 slots, DDR5 6400+ MHz (OC) support, insanely fast WiFi 6E, and onboard SupremeFX audio, this ATX motherboard ensures peak performance wrapped in a striking Republic of Gamers sleek design.",
    stock: 22, featured: true,
    specs: { Socket: "AM5", Chipset: "AMD B650E", Memory: "DDR5 (up to 6400+ MT/s)", "Expansion Slots": "1 x PCIe 5.0 x16" }
  },
  {
    id: "4", name: "Corsair Vengeance DDR5 32GB", category: "memory", price: 119, originalPrice: 149,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.6, reviewCount: 312, brand: "Corsair",
    description: "Push the limits of your system with Corsair Vengeance DDR5 memory. This 32GB (2x16GB) kit delivers higher frequencies, greater capacities, and better performance over previous generations. Operating at a blisteringly fast 5600MHz with tight C36 timings, it ensures your high-end CPU gets data quickly for faster rendering, smoother gameplay, and rapid application load times. Optimized for Intel and AMD latest platforms.",
    stock: 50, featured: true,
    specs: { Capacity: "32GB (2x16GB)", Speed: "5600MHz", Latency: "CL36", Type: "DDR5" }
  },
  {
    id: "5", name: "Samsung 990 Pro 2TB NVMe", category: "storage", price: 179, originalPrice: 229,
    image: "/products/samsung_990_pro.png", rating: 4.8, reviewCount: 456, brand: "Samsung",
    description: "The Samsung 990 Pro PCIe 4.0 NVMe M.2 SSD unlocks the full potential of your workstation or gaming console. Leveraging Samsung's latest V-NAND technology and custom controller, it delivers sequential read speeds up to 7,450 MB/s and write speeds up to 6,900 MB/s. Thermal management is refined with a dedicated heat spreader lamp and nickel-coated controller, ensuring stable performance during extreme processing tasks.",
    stock: 35, featured: true,
    specs: { Capacity: "2TB", Interface: "PCIe 4.0 x4", "Read Speed": "7,450 MB/s", "Write Speed": "6,900 MB/s" }
  },
  {
    id: "6", name: "Intel Core i9-14900K", category: "processors", price: 589,
    image: "/products/intel_i9_14900k.png", rating: 4.7, reviewCount: 167, brand: "Intel",
    description: "The 14th Generation Intel Core i9-14900K desktop processor sets new benchmarks for enthusiast performance. Featuring 24 cores (8 Performance-cores and 16 Efficient-cores) and 32 threads, it scales up to a blisteringly fast 6.0 GHz with Intel Thermal Velocity Boost. Compatible with Intel 600-series or 700-series chipsets, this unlocked CPU supports DDR5/DDR4 memory and PCIe 5.0 lanes for future-proof builds.",
    stock: 12, featured: true,
    specs: { Cores: "24 (8P+16E)", Threads: "32", "Max Turbo": "6.0 GHz", "Base Power": "125 W" }
  },
  {
    id: "7", name: "AMD Radeon RX 7900 XTX", category: "graphics-cards", price: 949, originalPrice: 999,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 156, brand: "AMD",
    description: "Experience the ultimate in gaming performance with the AMD Radeon RX 7900 XTX. Built on the revolutionary RDNA 3 architecture with chiplet technology, it delivers next-generation graphics, performance, and efficiency at 4K and beyond. Featuring 24GB of high-speed GDDR6 memory and advanced Ray Tracing accelerators, it's designed to dominate the most demanding titles with fluid frame rates and stunning visuals.",
    stock: 10,
    specs: { VRAM: "24GB GDDR6", "Stream Processors": "6144", "Game Clock": "2300 MHz", "TBP": "355W" }
  },
  {
    id: "8", name: "Logitech G Pro X Superlight", category: "peripherals", price: 159,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1000&auto=format&fit=crop", rating: 4.9, reviewCount: 890, brand: "Logitech",
    description: "Designed with the world's leading esports pros, the PRO X SUPERLIGHT is our lightest and fastest PRO mouse ever. Weighing less than 63 grams and featuring LIGHTSPEED wireless technology, it provides a lag-free connection and incredible responsiveness. The HERO 25K sensor offers pixel-perfect precision, perfectly capturing every flick and maneuver in the heat of competition. Winner of multiple pro player awards.",
    stock: 100, featured: true,
    specs: { Weight: "< 63g", Sensor: "HERO 25K", DPI: "25,000+", Connectivity: "LIGHTSPEED Wireless" }
  },
  {
    id: "9", name: "MSI MEG Z790 ACE", category: "motherboards", price: 699,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop", rating: 4.9, reviewCount: 42, brand: "MSI",
    description: "The MSI MEG Z790 ACE motherboard is a masterpiece of engineering, featuring an aesthetic black finish with gold flourishes. Designed for Intel 13th and 14th Gen processors, it offers a robust 24+1+2 phases power design and high-quality components. With support for PCIe 5.0, DDR5 memory, and lightning-fast Thunderbolt 4 ports, it provides extreme connectivity and performance for the most demanding PC enthusiasts.",
    stock: 5,
    specs: { Socket: "LGA 1700", Chipset: "Intel Z790", Memory: "DDR5 (up to 7800+ OC)", WiFi: "WiFi 6E" }
  },
  {
    id: "10", name: "NZXT H7 Flow", category: "peripherals", price: 129,
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1000&auto=format&fit=crop", rating: 4.5, reviewCount: 178, brand: "NZXT",
    description: "The NZXT H7 Flow is a premium mid-tower ATX case optimized for maximum cooling. Featuring perforated front and top panels, it directs airflow over high-performance components for better thermals. The spacious interior supports large GPUs and multiple radiator configurations, while the signature cable management system makes building clean and easy. Available in black or white with a tempered glass side panel.",
    stock: 25,
    specs: { FormFactor: "Mid-Tower", RadiatorSupport: "Up to 360mm", "Max GPU Length": "400mm", "Drive Bays": "2x 3.5\", 4+2x 2.5\"" }
  },
  {
    id: "11", name: "AMD Ryzen 7 7800X3D", category: "processors", price: 449,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.9, reviewCount: 534, brand: "AMD",
    description: "The AMD Ryzen 7 7800X3D is the undisputed king of gaming processors. Equipped with 96MB of L3 3D V-Cache technology, it delivers a massive boost in low-latency gaming performance that rivals significantly more expensive CPUs. With 8 cores and 16 threads, it's efficient, powerful, and built on the modern AM5 platform with DDR5 and PCIe 5.0 support. Ideal for high-refresh-rate gaming at any resolution.",
    stock: 18,
    specs: { Cores: "8", Threads: "16", "L3 Cache": "96MB", "Max Boost": "5.0 GHz" }
  },
  {
    id: "12", name: "WD Black SN850X 1TB", category: "storage", price: 89,
    image: "https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 678, brand: "Western Digital",
    description: "Crush the competition with the WD_BLACK SN850X NVMe SSD. Featuring PCIe Gen4 interface and sequential read speeds up to 7,300 MB/s, it significantly reduces load times in games and applications. The optional heatsink version maintains peak performance during intense gaming sessions, while Game Mode 2.0 features predictive loading and overhead management. Optimized for top-tier gaming rigs and content workstations.",
    stock: 60,
    specs: { Capacity: "1TB", Interface: "PCIe 4.0 x4", "Seq Read": "7,300 MB/s", "Seq Write": "6,300 MB/s" }
  },
  {
    id: "13", name: "Razer BlackWidow V4 Pro", category: "peripherals", price: 229,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 124, brand: "Razer",
    description: "Take total control of your gaming with the Razer BlackWidow V4 Pro. This feature-rich mechanical keyboard includes a Razer Command Dial, 8 dedicated macro keys, and signature 2-side underglow RGB. Choose between Razer Green Clicky, Yellow Linear, or Orange Tactile switches for your preferred feel. With a plush magnetic wrist rest and durable doubleshot PBT keycaps, it offers premium comfort and longevity for pro-level gaming.",
    stock: 40,
    specs: { Type: "Mechanical", Switches: "Razer Yellow/Green/Orange", PollingRate: "8,000 Hz", MacroKeys: "8 Dedicated" }
  },
  {
    id: "14", name: "SteelSeries Arctis Nova Pro", category: "peripherals", price: 349,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 215, brand: "SteelSeries",
    description: "Experience Almighty Audio with the Arctis Nova Pro Wireless. Featuring the Nova Pro Acoustic System and Premium High Fidelity Drivers, it delivers crystal-clear sound across all frequencies. Simultaneous 2.4GHz and Bluetooth connectivity allow you to listen to game audio and phone calls at the same time. The active noise cancellation (ANC) blocks out external distractions, while the hot-swappable battery system ensures endless wireless playtime.",
    stock: 30,
    specs: { Connectivity: "2.4GHz + BT + Wired", DriverType: "High Fidelity", Mic: "ClearCast Gen 2", Battery: "Infinite (Hot-Swap)" }
  },
  {
    id: "15", name: "NVIDIA RTX 4080 Super", category: "graphics-cards", price: 999,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 88, brand: "NVIDIA",
    description: "The GeForce RTX 4080 SUPER delivers a massive boost in performance and features for enthusiasts. Powered by the ADA Lovelace architecture, it features 16GB of G6X memory, DLSS 3.5 Ray Reconstruction, and enhanced AI-powered graphics. Whether you're gaming at 4K or creating complex 3D renders, the RTX 4080 SUPER provides the speed and reliability needed for high-end computing. Superior thermals ensure quiet operation under heavy load.",
    stock: 12,
    specs: { VRAM: "16GB GDDR6X", Cores: "10240 CUDA", "Boost Clock": "2.55 GHz", "Memory Bus": "256-bit" }
  },
  {
    id: "16", name: "Hikvision 4MP Turret Camera", category: "cameras", price: 89,
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 156, brand: "Hikvision",
    description: "The Hikvision 4MP Turret Camera provides high-quality surveillance with 2688 x 1520 resolution. Featuring AcuSense technology for human and vehicle target classification, it significantly reduces false alarms. The EXIR 2.0 advanced infrared technology provides a range of up to 30 meters for clear night vision. Built with IP67 weather resistance, this camera is ideal for both indoor and outdoor security setups.",
    stock: 50, featured: true,
    specs: { Resolution: "4MP (2688x1520)", Lens: "2.8mm Fixed", NightVision: "30m IR", Protection: "IP67 Weatherproof" }
  },
  {
    id: "17", name: "TP-Link Tapo C200", category: "cameras", price: 35, originalPrice: 45,
    image: "https://images.unsplash.com/photo-1524311583145-d4520309995c?q=80&w=1000&auto=format&fit=crop", rating: 4.6, reviewCount: 2450, brand: "TP-Link",
    description: "Keep your home safe with the Tapo C200 Home Security Wi-Fi Camera. Featuring 360-degree horizontal and 114-degree vertical range, it covers every corner of your room. With 1080p high-definition video, two-way audio, and sound/light alarms, it's the perfect budget-friendly solution for monitoring pets, babies, or general home security. Supports MicroSD cards up to 128GB for local storage.",
    stock: 120,
    specs: { Resolution: "1080p Full HD", View: "360° Pan / 114° Tilt", Audio: "Two-Way", Storage: "MicroSD Slot" }
  },
  {
    id: "18", name: "Dahua 8-Channel NVR", category: "cameras", price: 219,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 42, brand: "Dahua",
    description: "The Dahua Lite Series Network Video Recorder is designed for cost-effective, high-performance surveillance. Supporting up to 8 channels of IP camera input at 8MP resolution, it provides massive storage capabilities with up to 10TB HDD support. Featuring H.265+ compression technology, it saves bandwidth and storage space without compromising video quality. Perfect for small to medium-sized business security systems.",
    stock: 15,
    specs: { Channels: "8 Channel", MaxResolution: "8MP @ 30fps", Bandwidth: "80Mbps", "Decoding Capacity": "1ch@8MP / 4ch@1080p" }
  },
  {
    id: "19", name: "Reolink Solar PTZ Camera", category: "cameras", price: 189, originalPrice: 209,
    image: "https://images.unsplash.com/photo-1590012357758-294794e772cc?q=80&w=1000&auto=format&fit=crop", rating: 4.5, reviewCount: 178, brand: "Reolink",
    description: "Experience 100% wire-free security with the Reolink Argus PT with Solar Panel. This outdoor camera features 2K 4MP Super HD resolution and a 355-degree pan and 140-degree tilt for full-room or yard coverage. Powered by a high-capacity rechargeable battery and a non-stop solar panel, you'll never have to worry about charging. Includes smart person/vehicle detection and high-quality starlight night vision for absolute peace of mind.",
    stock: 25, featured: true,
    specs: { Resolution: "2K 4MP (2560x1440)", Power: "Battery + Solar", NightVision: "10m Color Starlight", Connection: "2.4/5GHz Dual-Band WiFi" }
  },
  {
    id: "20", name: "Arlo Pro 5S 2K Wireless", category: "cameras", price: 249,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 92, brand: "Arlo",
    description: "The Arlo Pro 5S 2K Wireless Security Camera is designed for professional-grade protection. Featuring 2K HDR video, integrated spotlight, and advanced dual-band Wi-Fi, it captures clear details even in low-light conditions. Arlo's Secure Plan offers smart alerts for people, vehicles, and packages, while the long-lasting battery ensures continuous outdoor surveillance. Compatible with Apple HomeKit, Alexa, and Google Assistant.",
    stock: 15,
    specs: { Resolution: "2K HDR", FieldOfView: "160 Degrees", NightVision: "Color", Audio: "Two-Way noise canceling" }
  },
  {
    id: "21", name: "Wyze Cam v3 Pro", category: "cameras", price: 59,
    image: "https://images.unsplash.com/photo-1524311583145-d4520309995c?q=80&w=1000&auto=format&fit=crop", rating: 4.4, reviewCount: 520, brand: "Wyze",
    description: "The Wyze Cam v3 Pro brings stunning 2K resolution to a compact indoor/outdoor design. With a powerful 1.2GHz dual-core processor and Edge AI for lightning-fast person detection, it's smarter than ever. Features a built-in 80dB siren, IP65 weather resistance, and an integrated spotlight. Enjoy free 14-day rolling cloud storage for person alerts out of the box, with continuous recording via MicroSD card (sold separately).",
    stock: 80,
    specs: { Resolution: "2K (2560x1440)", FOV: "116 Degrees", Protection: "IP65 Weatherproof", NightVision: "Color Starlight" }
  },
  {
    id: "22", name: "Ring Spotlight Cam Plus", category: "cameras", price: 169, originalPrice: 199,
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=1000&auto=format&fit=crop", rating: 4.6, reviewCount: 312, brand: "Ring",
    description: "The Ring Spotlight Cam Plus is a versatile outdoor security camera that includes bright LED lights and a security siren. Featuring 1080p HD video and Color Night Vision, you can see exactly what's happening at any hour. The customizable motion zones let you focus on what's important, while two-way talk allows you to speak to visitors from anywhere. Powered by a quick-release battery pack for easy recharging.",
    stock: 22,
    specs: { Resolution: "1080p HD", Lights: "Two LED Spotlights", Siren: "Remote-Activated", Power: "Battery (Solar Compatible)" }
  },
  {
    id: "23", name: "Logitech Circle View", category: "cameras", price: 159,
    image: "https://images.unsplash.com/photo-1590012357758-294794e772cc?q=80&w=1000&auto=format&fit=crop", rating: 4.3, reviewCount: 45, brand: "Logitech",
    description: "Designed exclusively for Apple HomeKit, the Logitech Circle View Wired Home Security Camera offers best-in-class video and privacy. With Logitech TrueView™ 1080p HD video, a wide 180° field of view, and high-quality night vision up to 15ft, it captures everything that matters. The premium sensor provides high dynamic range for superior clarity in high-contrast lighting. Features a tilting privacy shield and weather-resistant body.",
    stock: 10,
    specs: { Resolution: "1080p HD", FOV: "180° Ultra-Wide", NightVision: "Enhanced IR (up to 15ft)", Platform: "Apple HomeKit Secure Video Only" }
  },
  {
    id: "24", name: "Intel Core i7-14700K", category: "processors", price: 399, originalPrice: 429,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 142, brand: "Intel",
    description: "The 14th Gen Intel Core i7-14700K desktop processor features 20 cores (8 Performance-cores and 12 Efficient-cores) and 28 threads. Designed for gaming and multitasking excellence with up to 5.6 GHz turbo boost and PCIe 5.0 support.",
    stock: 25, featured: true,
    specs: { Cores: "20 (8P+12E)", Threads: "28", "Max Turbo": "5.6 GHz", "L3 Cache": "33 MB" }
  },
  {
    id: "25", name: "AMD Ryzen 5 7600X", category: "processors", price: 219, originalPrice: 249,
    image: "/products/amd_ryzen_7950x.png", rating: 4.7, reviewCount: 290, brand: "AMD",
    description: "High-value 6-core, 12-thread gaming processor built on Zen 4 architecture. Boost speeds up to 5.3 GHz with DDR5 and PCIe 5.0 support for accessible next-gen gaming builds.",
    stock: 35,
    specs: { Cores: "6", Threads: "12", "Base Clock": "4.7 GHz", "Boost Clock": "5.3 GHz" }
  },
  {
    id: "26", name: "AMD Radeon RX 7800 XT", category: "graphics-cards", price: 499, originalPrice: 529,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 210, brand: "AMD",
    description: "Designed for immersive 1440p gaming with 16GB GDDR6 memory, RDNA 3 architecture, and DisplayPort 2.1 support for ultra-smooth high-refresh gaming.",
    stock: 18, featured: true,
    specs: { VRAM: "16GB GDDR6", "Stream Processors": "3840", "Game Clock": "2124 MHz", "TBP": "263W" }
  },
  {
    id: "27", name: "NVIDIA RTX 4060 Ti 16GB", category: "graphics-cards", price: 449,
    image: "/products/rtx_4070_ti.png", rating: 4.6, reviewCount: 175, brand: "NVIDIA",
    description: "Efficient 1080p and 1440p GPU with 16GB GDDR6 VRAM and DLSS 3 Frame Generation technology. Ideal for creators and modern ray-traced gaming.",
    stock: 22,
    specs: { VRAM: "16GB GDDR6", Cores: "4352 CUDA", "Boost Clock": "2.54 GHz" }
  },
  {
    id: "28", name: "Gigabyte Z790 AORUS Elite AX", category: "motherboards", price: 259, originalPrice: 289,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop", rating: 4.7, reviewCount: 118, brand: "Gigabyte",
    description: "Feature-packed Intel LGA 1700 ATX motherboard with 16+1+2 Twin Digital VRM, DDR5 XMP 7600MHz+ support, PCIe 5.0 slot, and onboard Wi-Fi 6E.",
    stock: 14,
    specs: { Socket: "LGA 1700", Chipset: "Intel Z790", Memory: "DDR5 (up to 7600+ OC)", WiFi: "Wi-Fi 6E" }
  },
  {
    id: "29", name: "ASRock B650 Steel Legend WiFi", category: "motherboards", price: 219,
    image: "/products/asus_b650e_f.png", rating: 4.6, reviewCount: 88, brand: "ASRock",
    description: "Durable AM5 motherboard featuring 14+2+1 phase Dr.MOS power design, PCIe 5.0 M.2 slot, DDR5 memory boost, and Wi-Fi 6E connectivity.",
    stock: 19,
    specs: { Socket: "AM5", Chipset: "AMD B650", Memory: "DDR5 6400MHz+", WiFi: "Wi-Fi 6E" }
  },
  {
    id: "30", name: "G.Skill Trident Z5 RGB 32GB DDR5", category: "memory", price: 139, originalPrice: 159,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.9, reviewCount: 340, brand: "G.Skill",
    description: "Flagship DDR5 memory kit (2x16GB) running at 6000MHz CL30. Features customizable RGB light bar and sleek aluminum heatspreaders for elite gaming rigs.",
    stock: 45, featured: true,
    specs: { Capacity: "32GB (2x16GB)", Speed: "6000MHz", Latency: "CL30", Type: "DDR5 RGB" }
  },
  {
    id: "31", name: "Kingston Fury Beast 64GB DDR5", category: "memory", price: 219,
    image: "/products/corsair_vengeance_ddr5.png", rating: 4.7, reviewCount: 165, brand: "Kingston",
    description: "High-capacity 64GB (2x32GB) DDR5 kit at 5200MHz. Designed for heavy video editing, 3D modeling, and intensive multitasking with low-profile heat spreaders.",
    stock: 28,
    specs: { Capacity: "64GB (2x32GB)", Speed: "5200MHz", Latency: "CL40", Type: "DDR5" }
  },
  {
    id: "32", name: "Crucial T700 2TB PCIe 5.0 NVMe", category: "storage", price: 279, originalPrice: 319,
    image: "/products/samsung_990_pro.png", rating: 4.9, reviewCount: 104, brand: "Crucial",
    description: "Blistering Gen5 NVMe M.2 SSD delivering read speeds up to 12,400 MB/s and write speeds up to 11,800 MB/s. Built with 232-layer TLC NAND for extreme productivity.",
    stock: 15, featured: true,
    specs: { Capacity: "2TB", Interface: "PCIe 5.0 x4", "Read Speed": "12,400 MB/s", "Write Speed": "11,800 MB/s" }
  },
  {
    id: "33", name: "Seagate Barracuda 4TB HDD", category: "storage", price: 79,
    image: "https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=1000&auto=format&fit=crop", rating: 4.5, reviewCount: 512, brand: "Seagate",
    description: "Reliable 4TB 3.5-inch desktop hard drive operating at 5400RPM with 256MB cache for massive mass storage of games, media files, and system backups.",
    stock: 75,
    specs: { Capacity: "4TB", Interface: "SATA 6Gb/s", FormFactor: "3.5-inch", Cache: "256MB" }
  },
  {
    id: "34", name: "ASUS ROG Swift 32\" 4K OLED", category: "peripherals", price: 1299, originalPrice: 1399,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop", rating: 4.9, reviewCount: 76, brand: "ASUS",
    description: "32-inch 4K UHD (3840x2160) QD-OLED gaming monitor featuring 240Hz refresh rate, 0.03ms response time, custom heatsink cooling, and G-SYNC compatibility.",
    stock: 8, featured: true,
    specs: { Resolution: "4K UHD (3840x2160)", Panel: "QD-OLED", RefreshRate: "240Hz", ResponseTime: "0.03ms GTG" }
  },
  {
    id: "35", name: "Keychron Q1 Pro Wireless", category: "peripherals", price: 199,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1000&auto=format&fit=crop", rating: 4.8, reviewCount: 204, brand: "Keychron",
    description: "75% layout QMK/VIA wireless custom mechanical keyboard with CNC aluminum body, double-gasket design, hot-swappable switches, and Bluetooth 5.1 / Type-C connection.",
    stock: 30,
    specs: { Layout: "75%", Body: "Full CNC Aluminum", Connection: "Bluetooth 5.1 + Wired", HotSwappable: "Yes" }
  }
];

export const services: Service[] = [
  {
    id: "1", name: "Custom PC Assembly", price: "From ₹1,999",
    icon: "Wrench",
    description: "Professional assembly of your custom PC build with cable management and stress testing.",
    features: ["Expert assembly", "Cable management", "48-hour stress test", "1-year warranty"],
  },
  {
    id: "2", name: "CCTV Installation", price: "From ₹3,999",
    icon: "Camera",
    description: "Complete CCTV setup for home or business with remote monitoring capabilities.",
    features: ["Site survey", "HD cameras", "Remote access setup", "24/7 recording"],
  },
  {
    id: "3", name: "Network Setup", price: "From ₹2,499",
    icon: "Wifi",
    description: "Professional network infrastructure setup for homes and offices.",
    features: ["Network design", "Router configuration", "Security setup", "Speed optimization"],
  },
  {
    id: "4", name: "Laptop Repair", price: "From ₹999",
    icon: "Laptop",
    description: "Expert laptop diagnosis and repair for all brands and models.",
    features: ["Free diagnosis", "Screen replacement", "Battery replacement", "Data backup"],
  },
  {
    id: "5", name: "Data Recovery", price: "From ₹1,499",
    icon: "Database",
    description: "Professional data recovery from damaged drives, SSDs, and storage media.",
    features: ["Free evaluation", "Clean room recovery", "All media types", "Confidential handling"],
  },
  {
    id: "6", name: "Printer Repair & Service", price: "From ₹799",
    icon: "Printer",
    description: "Comprehensive printer diagnosis, cartridge refill, head cleaning, and hardware repair for laser and inkjet printers.",
    features: ["Inkjet & Laserjet repair", "Toner & cartridge refill", "Paper jam & roller fix", "Network printer setup"],
  },
];

export const testimonials: Review[] = [
  { id: "1", userName: "Alex Chen", rating: 5, comment: "GADGET ZONE built my dream gaming rig. The cable management was immaculate and performance exceeded expectations!", date: "2026-02-15" },
  { id: "2", userName: "Sarah Williams", rating: 5, comment: "Incredible customer service. They recovered data from my crashed drive that two other shops said was impossible.", date: "2026-01-28" },
  { id: "3", userName: "Marcus Johnson", rating: 4, comment: "Great selection of components and competitive pricing. The PC builder tool made choosing parts super easy.", date: "2026-02-01" },
  { id: "4", userName: "Emily Park", rating: 5, comment: "They set up our entire office network in a day. Everything runs perfectly. Highly recommend their business services!", date: "2026-03-05" },
];

export const pcComponents: Record<string, PCComponent[]> = {
  processor: [
    { id: "cpu1", category: "processor", name: "AMD Ryzen 9 7950X", price: 549, brand: "AMD", specs: "16C/32T, 5.7GHz Boost" },
    { id: "cpu2", category: "processor", name: "Intel Core i9-14900K", price: 589, brand: "Intel", specs: "24C/32T, 6.0GHz Boost" },
    { id: "cpu3", category: "processor", name: "AMD Ryzen 7 7800X3D", price: 449, brand: "AMD", specs: "8C/16T, 3D V-Cache" },
    { id: "cpu4", category: "processor", name: "Intel Core i7-14700K", price: 399, brand: "Intel", specs: "20C/28T, 5.6GHz Boost" },
  ],
  motherboard: [
    { id: "mb1", category: "motherboard", name: "ASUS ROG Strix B650E-F", price: 329, brand: "ASUS", specs: "AM5, DDR5, PCIe 5.0" },
    { id: "mb2", category: "motherboard", name: "MSI MEG Z790 ACE", price: 499, brand: "MSI", specs: "LGA1700, DDR5, WiFi 7" },
    { id: "mb3", category: "motherboard", name: "Gigabyte B650 Aorus Elite", price: 219, brand: "Gigabyte", specs: "AM5, DDR5, 2.5G LAN" },
  ],
  ram: [
    { id: "ram1", category: "ram", name: "Corsair Vengeance DDR5 32GB", price: 119, brand: "Corsair", specs: "2x16GB, 5600MHz, C36" },
    { id: "ram2", category: "ram", name: "G.Skill Trident Z5 RGB 32GB", price: 139, brand: "G.Skill", specs: "2x16GB, 6000MHz, C30" },
    { id: "ram3", category: "ram", name: "Kingston Fury Beast 64GB", price: 219, brand: "Kingston", specs: "2x32GB, 5200MHz, C40" },
  ],
  storage: [
    { id: "sto1", category: "storage", name: "Samsung 990 Pro 2TB", price: 179, brand: "Samsung", specs: "NVMe Gen4, 7450MB/s" },
    { id: "sto2", category: "storage", name: "WD Black SN850X 1TB", price: 89, brand: "WD", specs: "NVMe Gen4, 7300MB/s" },
    { id: "sto3", category: "storage", name: "Seagate Barracuda 4TB HDD", price: 79, brand: "Seagate", specs: "7200RPM, SATA III" },
  ],
  gpu: [
    { id: "gpu1", category: "gpu", name: "NVIDIA RTX 4090", price: 1599, brand: "NVIDIA", specs: "24GB GDDR6X, DLSS 3" },
    { id: "gpu2", category: "gpu", name: "NVIDIA RTX 4070 Ti Super", price: 799, brand: "NVIDIA", specs: "16GB GDDR6X, DLSS 3" },
    { id: "gpu3", category: "gpu", name: "AMD RX 7900 XTX", price: 949, brand: "AMD", specs: "24GB GDDR6, FSR 3" },
    { id: "gpu4", category: "gpu", name: "NVIDIA RTX 4060 Ti", price: 449, brand: "NVIDIA", specs: "8GB GDDR6, DLSS 3" },
  ],
  psu: [
    { id: "psu1", category: "psu", name: "Corsair RM1000x", price: 189, brand: "Corsair", specs: "1000W, 80+ Gold, Modular" },
    { id: "psu2", category: "psu", name: "Seasonic Prime TX-850", price: 229, brand: "Seasonic", specs: "850W, 80+ Titanium" },
    { id: "psu3", category: "psu", name: "EVGA SuperNOVA 750 G7", price: 109, brand: "EVGA", specs: "750W, 80+ Gold" },
  ],
  cooling: [
    { id: "cool1", category: "cooling", name: "NZXT Kraken X73", price: 179, brand: "NZXT", specs: "360mm AIO, LCD Display" },
    { id: "cool2", category: "cooling", name: "Noctua NH-D15", price: 109, brand: "Noctua", specs: "Dual Tower, Air Cooler" },
    { id: "cool3", category: "cooling", name: "Corsair iCUE H150i", price: 159, brand: "Corsair", specs: "360mm AIO, RGB" },
  ],
  case: [
    { id: "case1", category: "case", name: "NZXT H7 Flow", price: 129, brand: "NZXT", specs: "Mid-Tower, High Airflow" },
    { id: "case2", category: "case", name: "Lian Li O11 Dynamic EVO", price: 169, brand: "Lian Li", specs: "Mid-Tower, Dual Chamber" },
    { id: "case3", category: "case", name: "Fractal Design Torrent", price: 189, brand: "Fractal", specs: "ATX, Open Grille" },
  ],
};

export default products;