import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    category:      { type: String, required: true, trim: true, index: true },
    price:         { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    image:         { type: String, default: "" },
    images:        { type: [String], default: [] },
    features:      { type: [String], default: [] },
    rating:        { type: Number, default: 0 },
    reviewCount:   { type: Number, default: 0 },
    brand:         { type: String, default: "", trim: true, index: true },
    description:   { type: String, default: "" },
    stock:         { type: Number, default: 0 },
    featured:      { type: Boolean, default: false, index: true },
    specs:         { type: Map, of: String, default: {} },
    warranty:      { type: String, default: "1 Year Onsite Hardware Service" },

    // Structured Technical Specifications for Smart Search
    ram:           { type: String, default: "", trim: true },
    storage:       { type: String, default: "", trim: true },
    processor:     { type: String, default: "", trim: true },
    graphics:      { type: String, default: "", trim: true },
    model:         { type: String, default: "", trim: true },

    // SEO Optimization Fields
    slug:          { type: String, default: "", trim: true, index: true },
    seoTitle:      { type: String, default: "", trim: true },
    seoDescription:{ type: String, default: "", trim: true },
    metaKeywords:  { type: [String], default: [] },

    // Normalized Search Tokens Array (for fast multi-keyword and spec matching)
    searchTokens:  { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

productSchema.pre("save", function (next) {
  // Sync image and images array
  if (Array.isArray(this.images) && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }

  // Auto-populate structured specs from Map if empty
  if (this.specs && typeof this.specs.get === "function") {
    if (!this.ram) {
      this.ram = this.specs.get("RAM") || this.specs.get("RAM Capacity") || "";
    }
    if (!this.storage) {
      this.storage = this.specs.get("Storage") || this.specs.get("SSD Capacity") || this.specs.get("Hard Drive") || "";
    }
    if (!this.processor) {
      this.processor = this.specs.get("Processor") || this.specs.get("Processor Name") || "";
    }
    if (!this.graphics) {
      this.graphics = this.specs.get("Graphics") || this.specs.get("Graphic Processor") || "";
    }
    if (!this.model) {
      this.model = this.specs.get("Model") || this.specs.get("Model Number") || "";
    }
  }

  // Generate SEO URL Slug if not provided
  if (!this.slug && this.name) {
    const baseSlug = slugify(this.name);
    const suffix = this._id ? String(this._id).slice(-4) : Math.random().toString(36).slice(-4);
    this.slug = `${baseSlug}-${suffix}`;
  }

  // Auto-generate SEO Title & Meta Description if not provided
  if (!this.seoTitle && this.name) {
    const brandPrefix = this.brand ? `${this.brand} ` : "";
    this.seoTitle = `${brandPrefix}${this.name} | GadgetZone`.slice(0, 70);
  }
  if (!this.seoDescription && this.name) {
    const specSnippet = [this.processor, this.ram, this.storage].filter(Boolean).join(", ");
    const priceText = this.price ? `₹${this.price.toLocaleString("en-IN")}` : "";
    this.seoDescription = `Buy ${this.name} ${specSnippet ? `with ${specSnippet}` : ""}. Best price ${priceText} at GadgetZone. Genuine hardware with warranty and fast delivery.`.slice(0, 160);
  }

  // Build Normalized Search Tokens for Instant Multi-Condition & Variant Matching
  const tokenSet = new Set();
  const rawFields = [
    this.name,
    this.brand,
    this.category,
    this.processor,
    this.ram,
    this.storage,
    this.graphics,
    this.model,
    ...(Array.isArray(this.features) ? this.features : []),
  ];

  if (this.specs && typeof this.specs.forEach === "function") {
    this.specs.forEach((val, key) => {
      rawFields.push(String(key));
      rawFields.push(String(val));
    });
  }

  rawFields.forEach((field) => {
    if (typeof field === "string" && field.trim()) {
      // Split into word tokens
      const words = field
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      words.forEach((w) => tokenSet.add(w));

      // Also add compacted alphanumeric strings (e.g., "8 gb" -> "8gb", "500 gb" -> "500gb")
      const compacted = field.toLowerCase().replace(/\s+/g, "");
      const matches = compacted.match(/\d+(?:gb|tb|mb|ghz|mhz)/g);
      if (matches) {
        matches.forEach((m) => tokenSet.add(m));
      }
    }
  });

  this.searchTokens = Array.from(tokenSet);
  next();
});

// Compound Text Index for Full-Text Search
productSchema.index(
  {
    name: "text",
    brand: "text",
    category: "text",
    processor: "text",
    ram: "text",
    storage: "text",
    graphics: "text",
    model: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      brand: 8,
      processor: 7,
      ram: 6,
      storage: 6,
      graphics: 5,
      model: 5,
      category: 4,
      description: 1,
    },
    name: "ProductFullTextIndex",
  }
);

export default mongoose.model("Product", productSchema);
