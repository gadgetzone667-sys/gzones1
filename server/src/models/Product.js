import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  category:      { type: String, required: true },
  price:         { type: Number, required: true },
  originalPrice: { type: Number },
  image:         { type: String, default: "" },
  images:        { type: [String], default: [] },
  features:      { type: [String], default: [] },
  rating:        { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  brand:         { type: String, default: "" },
  description:   { type: String, default: "" },
  stock:         { type: Number, default: 0 },
  featured:      { type: Boolean, default: false },
  specs:         { type: Map, of: String, default: {} },
  warranty:      { type: String, default: "1 Year Onsite Hardware Service" },
}, { timestamps: true });

productSchema.pre("save", function (next) {
  if (Array.isArray(this.images) && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
  next();
});

export default mongoose.model("Product", productSchema);
