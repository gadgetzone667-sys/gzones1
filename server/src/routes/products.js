import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper to escape regex special characters safely
function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Smart Multi-Specification Query Builder
 * Parses queries like "HP 8GB RAM 500GB storage" or "500GB SSD HP 8GB RAM"
 * and constructs an AND-based MongoDB search filter matching all specifications.
 */
function buildSmartSearchFilter(queryStr) {
  const cleanQuery = (queryStr || "").trim().toLowerCase();
  if (!cleanQuery) return {};

  // Extract structured specifications from the query string
  const extracted = {
    brand: null,
    ram: null,
    storage: null,
    processor: null,
    graphics: null,
  };

  let remaining = cleanQuery;

  // 1. Extract RAM pattern (e.g. "8gb", "16 gb ram", "32gb ddr4")
  const ramMatch = remaining.match(/\b(\d+)\s*(?:gb|mb)\s*(?:ram|memory|ddr\d?)?\b/i);
  if (ramMatch) {
    extracted.ram = ramMatch[0].trim();
    // Compact version e.g. "8gb"
    const num = ramMatch[1];
    extracted.ramNum = `${num}gb`;
  }

  // 2. Extract Storage pattern (e.g. "500gb", "512 gb ssd", "1tb nvme", "2tb storage")
  const storageMatch = remaining.match(/\b(\d+)\s*(?:gb|tb)\s*(?:ssd|nvme|hdd|storage|hard drive)?\b/i);
  if (storageMatch && storageMatch[0] !== extracted.ram) {
    extracted.storage = storageMatch[0].trim();
    const num = storageMatch[1];
    const unit = storageMatch[0].toLowerCase().includes("tb") ? "tb" : "gb";
    extracted.storageNum = `${num}${unit}`;
  }

  // 3. Extract Common Tech Brands
  const knownBrands = [
    "hp",
    "dell",
    "lenovo",
    "asus",
    "acer",
    "apple",
    "msi",
    "samsung",
    "intel",
    "amd",
    "gigabyte",
    "corsair",
    "logitech",
    "sony",
    "crucial",
    "seagate",
    "western digital",
    "wd",
    "nvidia",
  ];
  for (const b of knownBrands) {
    const brandRegex = new RegExp(`\\b${b}\\b`, "i");
    if (brandRegex.test(remaining)) {
      extracted.brand = b;
      break;
    }
  }

  // 4. Extract Processor indicators (e.g. "i5", "i7", "i9", "core ultra", "ryzen 5", "ryzen 7", "m1", "m2", "m3")
  const procMatch = remaining.match(/\b(i3|i5|i7|i9|ryzen\s*\d+|core\s*ultra|m1|m2|m3|m4)\b/i);
  if (procMatch) {
    extracted.processor = procMatch[0].trim();
  }

  // 5. Extract Graphics indicators (e.g. "rtx 4060", "gtx 1650", "radeon", "geforce", "1080")
  const gpuMatch = remaining.match(/\b(rtx\s*\d+|gtx\s*\d+|\b1080\b|radeon|geforce|intel arc)\b/i);
  if (gpuMatch) {
    extracted.graphics = gpuMatch[0].trim();
  }

  // 6. Tokenize remaining words, removing trivial stop words
  const stopWords = new Set(["in", "with", "for", "and", "the", "a", "an", "of", "to", "at", "by", "from", "on"]);
  const tokens = cleanQuery
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  const andConditions = [];

  // Every token must match in at least one relevant field or searchTokens
  tokens.forEach((token) => {
    const rx = new RegExp(escapeRegex(token), "i");
    const compacted = token.replace(/\s+/g, "");

    const tokenOr = [
      { name: rx },
      { brand: rx },
      { category: rx },
      { processor: rx },
      { ram: rx },
      { storage: rx },
      { graphics: rx },
      { model: rx },
      { searchTokens: token },
      { searchTokens: compacted },
      { features: rx },
    ];

    andConditions.push({ $or: tokenOr });
  });

  // If specific hardware specs were extracted, add targeted field-level conditions
  if (extracted.brand) {
    const bRx = new RegExp(`^${escapeRegex(extracted.brand)}|${escapeRegex(extracted.brand)}`, "i");
    andConditions.push({
      $or: [{ brand: bRx }, { name: bRx }, { searchTokens: extracted.brand }],
    });
  }

  if (extracted.ramNum) {
    const rRx = new RegExp(escapeRegex(extracted.ramNum), "i");
    andConditions.push({
      $or: [{ ram: rRx }, { name: rRx }, { searchTokens: extracted.ramNum }],
    });
  }

  if (extracted.storageNum) {
    const sRx = new RegExp(escapeRegex(extracted.storageNum), "i");
    andConditions.push({
      $or: [{ storage: sRx }, { name: sRx }, { searchTokens: extracted.storageNum }],
    });
  }

  if (extracted.processor) {
    const pRx = new RegExp(escapeRegex(extracted.processor), "i");
    andConditions.push({
      $or: [{ processor: pRx }, { name: pRx }, { searchTokens: extracted.processor }],
    });
  }

  if (extracted.graphics) {
    const gRx = new RegExp(escapeRegex(extracted.graphics), "i");
    andConditions.push({
      $or: [{ graphics: gRx }, { name: gRx }, { searchTokens: extracted.graphics }],
    });
  }

  if (andConditions.length === 0) return {};
  if (andConditions.length === 1) return andConditions[0];
  return { $and: andConditions };
}

// -------------------------------------------------------------
// 1. GET /api/products/suggestions (Autocomplete & Search Suggestions)
// -------------------------------------------------------------
router.get("/suggestions", async (req, res) => {
  try {
    const queryStr = (req.query.q || "").trim();
    if (!queryStr || queryStr.length < 2) {
      return res.json({ products: [], suggestions: [] });
    }

    const filter = buildSmartSearchFilter(queryStr);

    const matchingProducts = await Product.find(filter)
      .select("name brand category price image images slug specs ram storage processor")
      .limit(6)
      .lean();

    // Collect smart suggestion keyword tags (e.g. Brands, Categories, Specs)
    const suggestionSet = new Set();
    const rx = new RegExp(escapeRegex(queryStr), "i");

    matchingProducts.forEach((p) => {
      if (p.brand && rx.test(p.brand)) suggestionSet.add(p.brand);
      if (p.category && rx.test(p.category)) suggestionSet.add(p.category);
      if (p.processor && rx.test(p.processor)) suggestionSet.add(`${p.brand ? p.brand + " " : ""}${p.processor}`);
      if (p.ram) suggestionSet.add(`${p.brand ? p.brand + " " : ""}${p.ram} RAM`);
      if (p.storage) suggestionSet.add(`${p.storage} Storage`);
    });

    const products = matchingProducts.map((p) => ({
      id: String(p._id),
      name: p.name,
      brand: p.brand || "",
      category: p.category,
      price: p.price,
      image: p.image || (Array.isArray(p.images) && p.images[0]) || "",
      slug: p.slug || String(p._id),
    }));

    res.json({
      products,
      suggestions: Array.from(suggestionSet).slice(0, 5),
    });
  } catch (err) {
    console.error("GET /api/products/suggestions error:", err.message);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/products/slug/:slug (SEO Friendly URL Lookup)
// -------------------------------------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    let product = await Product.findOne({ slug });

    // Fallback if slug happens to be an ObjectId
    if (!product && mongoose.Types.ObjectId.isValid(slug)) {
      product = await Product.findById(slug);
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/products (Advanced Search, Filtering, Sort, Pagination)
// -------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      featured,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    } = req.query;

    const filter = {};

    // 1. Smart multi-spec search query
    if (q && String(q).trim()) {
      const searchFilter = buildSmartSearchFilter(String(q).trim());
      Object.assign(filter, searchFilter);
    }

    // 2. Category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // 3. Brand filter
    if (brand && brand !== "all") {
      filter.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");
    }

    // 4. Featured filter
    if (featured === "true") {
      filter.featured = true;
    }

    // 5. Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting definition
    let sortObj = { createdAt: -1 };
    switch (sort) {
      case "price-asc":
        sortObj = { price: 1 };
        break;
      case "price-desc":
        sortObj = { price: -1 };
        break;
      case "rating":
        sortObj = { rating: -1, reviewCount: -1 };
        break;
      case "name-asc":
        sortObj = { name: 1 };
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Pagination support
    const hasPagination = Boolean(page);
    const pageNum = Math.max(1, parseInt(String(page || "1"), 10) || 1);
    const limitNum = Math.max(1, parseInt(String(limit || "20"), 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    if (hasPagination) {
      const [products, total] = await Promise.all([
        Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
        Product.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limitNum) || 1;
      res.setHeader("X-Total-Count", total);

      return res.json({
        products: products || [],
        total,
        page: pageNum,
        totalPages,
        limit: limitNum,
      });
    }

    // Without pagination parameter: return array for backward compatibility
    const products = await Product.find(filter).sort(sortObj).lean();
    res.setHeader("X-Total-Count", products.length);
    res.json(products || []);
  } catch (err) {
    console.error("GET /api/products error:", err.message);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 4. GET /api/products/:id
// -------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Product not found." });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (err) {
    console.error("GET /api/products/:id error:", err.message);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/products (Admin Only, Includes SEO & Tech Specs)
// -------------------------------------------------------------
router.post("/", requireAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 6. PUT /api/products/:id (Admin Only)
// -------------------------------------------------------------
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    Object.assign(product, req.body);
    await product.save(); // Triggers pre("save") hook for searchTokens, specs & SEO

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Validation error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 7. DELETE /api/products/:id (Admin Only)
// -------------------------------------------------------------
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export { buildSmartSearchFilter };
export default router;
