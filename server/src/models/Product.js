import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  category:      { type: String, required: true },
  price:         { type: Number, required: true },
  originalPrice: { type: Number },
  image:         { type: String, default: "" },
  rating:        { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  brand:         { type: String, default: "" },
  description:   { type: String, default: "" },
  stock:         { type: Number, default: 0 },
  featured:      { type: Boolean, default: false },
  specs:         { type: Map, of: String, default: {} },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
