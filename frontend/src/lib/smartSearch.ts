import type { Product } from "../data/products";

export interface ParsedSpecs {
  brand?: string;
  ram?: string;
  storage?: string;
  processor?: string;
  graphics?: string;
  generalTokens: string[];
}

/**
 * Extracts technical specifications from a multi-term query string
 * (e.g. "HP 8GB RAM 500GB storage" -> { brand: "HP", ram: "8GB", storage: "500GB", ... })
 */
export function parseSearchQuery(query: string): ParsedSpecs {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return { generalTokens: [] };

  const parsed: ParsedSpecs = {
    generalTokens: [],
  };

  // 1. Recognize RAM (e.g. 8gb, 16 gb ram, 32gb ddr5)
  const ramMatch = clean.match(/\b(\d+)\s*(?:gb|mb)\s*(?:ram|memory|ddr\d?)?\b/i);
  if (ramMatch) {
    parsed.ram = `${ramMatch[1]}gb`;
  }

  // 2. Recognize Storage (e.g. 500gb, 512 gb ssd, 1tb nvme, 2tb storage)
  const storageMatch = clean.match(/\b(\d+)\s*(?:gb|tb)\s*(?:ssd|nvme|hdd|storage|hard drive)?\b/i);
  if (storageMatch && storageMatch[0] !== ramMatch?.[0]) {
    const num = storageMatch[1];
    const unit = storageMatch[0].toLowerCase().includes("tb") ? "tb" : "gb";
    parsed.storage = `${num}${unit}`;
  }

  // 3. Recognize Known Brands
  const commonBrands = [
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
  for (const b of commonBrands) {
    const bRegex = new RegExp(`\\b${b}\\b`, "i");
    if (bRegex.test(clean)) {
      parsed.brand = b.toUpperCase();
      break;
    }
  }

  // 4. Recognize Processor
  const procMatch = clean.match(/\b(i3|i5|i7|i9|ryzen\s*\d+|core\s*ultra|m1|m2|m3|m4)\b/i);
  if (procMatch) {
    parsed.processor = procMatch[0].toUpperCase();
  }

  // 5. Recognize Graphics
  const gpuMatch = clean.match(/\b(rtx\s*\d+|gtx\s*\d+|\b1080\b|radeon|geforce)\b/i);
  if (gpuMatch) {
    parsed.graphics = gpuMatch[0].toUpperCase();
  }

  // 6. Tokenize remaining terms
  const stopWords = new Set(["in", "with", "for", "and", "the", "a", "an", "of", "to", "at", "by", "from", "on"]);
  const tokens = clean
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  parsed.generalTokens = tokens;
  return parsed;
}

/**
 * Evaluates whether a product matches a smart multi-specification query
 * Supports case-insensitivity, arbitrary word order, and partial name matching.
 */
export function matchesSmartQuery(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true;

  const parsed = parseSearchQuery(query);
  const specs = product.specs || {};

  // Build searchable text corpus for the product
  const corpusParts = [
    product.name,
    product.brand,
    product.category,
    product.processor || specs.Processor || specs["Processor Name"] || "",
    product.ram || specs.RAM || specs["RAM Capacity"] || "",
    product.storage || specs.Storage || specs["SSD Capacity"] || specs["Hard Drive"] || "",
    product.graphics || specs.Graphics || specs["Graphic Processor"] || "",
    product.model || specs.Model || specs["Model Number"] || "",
    ...(Array.isArray(product.features) ? product.features : []),
    ...(Array.isArray(product.searchTokens) ? product.searchTokens : []),
    Object.values(specs).join(" "),
  ];

  const fullCorpus = corpusParts.join(" ").toLowerCase();
  const compactedCorpus = fullCorpus.replace(/\s+/g, "");

  // Every token in the parsed query must be matched
  for (const token of parsed.generalTokens) {
    const rx = new RegExp(`\\b${token}|${token}`, "i");
    if (!rx.test(fullCorpus) && !compactedCorpus.includes(token)) {
      return false;
    }
  }

  // If specific hardware specs were extracted, test them
  if (parsed.brand) {
    const brandLower = parsed.brand.toLowerCase();
    const productBrand = (product.brand || "").toLowerCase();
    const productName = (product.name || "").toLowerCase();
    if (!productBrand.includes(brandLower) && !productName.includes(brandLower)) {
      return false;
    }
  }

  if (parsed.ram) {
    const ramToken = parsed.ram.toLowerCase();
    const ramNum = ramToken.replace(/[^0-9]/g, "");
    const ramCorpus = [
      product.ram,
      specs.RAM,
      specs["RAM Capacity"],
      product.name,
    ]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!ramCorpus.includes(ramToken) && !ramCorpus.includes(`${ramNum}gb`)) {
      return false;
    }
  }

  if (parsed.storage) {
    const storageToken = parsed.storage.toLowerCase();
    const storageCorpus = [
      product.storage,
      specs.Storage,
      specs["SSD Capacity"],
      specs["Hard Drive"],
      product.name,
    ]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!storageCorpus.includes(storageToken)) {
      return false;
    }
  }

  return true;
}

