import mongoose from "mongoose";

const pcComponentSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["processor", "motherboard", "ram", "storage", "gpu", "psu", "cooling", "case"]
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  brand: String,
  specs: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("PCComponent", pcComponentSchema);
