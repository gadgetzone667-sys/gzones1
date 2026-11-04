import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userEmail: {
      type: String,
      default: "",
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone1: {
      type: String,
      required: true,
      trim: true,
    },
    phone2: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    serviceId: {
      type: String,
      default: "",
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    servicePrice: {
      type: String,
      default: "Quote on Inspection",
      trim: true,
    },
    bookingDate: {
      type: String,
      required: true,
      trim: true,
    },
    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    assignedTechnician: {
      type: String,
      default: "GadgetZone Service Engineer",
      trim: true,
    },
    technicianNotes: {
      type: String,
      default: "",
      trim: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ServiceBooking", serviceBookingSchema);
