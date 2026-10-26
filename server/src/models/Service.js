import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  features: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Service", serviceSchema);
