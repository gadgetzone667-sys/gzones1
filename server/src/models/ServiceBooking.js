import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    primaryPhone: {
      type: String,
      required: true,
      trim: true,
    },
    phone1: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      default: "",
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
    bookingPurpose: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    preferredDate: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: {
      type: String,
      trim: true,
    },
    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: ["Pending Review", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending Review",
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending Review", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending Review",
      index: true,
    },
    assignedEngineer: {
      type: String,
      default: "Unassigned",
      trim: true,
    },
    assignedTechnician: {
      type: String,
      default: "Unassigned",
      trim: true,
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    technicianNotes: {
      type: String,
      default: "",
      trim: true,
    },
    cancellationReason: {
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

serviceBookingSchema.pre("save", function (next) {
  // Sync ID fields
  if (!this.userId && this.customerId) this.userId = this.customerId;
  if (!this.customerId && this.userId) this.customerId = this.userId;

  // Sync Phone fields
  if (!this.phone1 && this.primaryPhone) this.phone1 = this.primaryPhone;
  if (!this.primaryPhone && this.phone1) this.primaryPhone = this.phone1;

  if (!this.phone2 && this.alternatePhone) this.phone2 = this.alternatePhone;
  if (!this.alternatePhone && this.phone2) this.alternatePhone = this.phone2;

  // Sync Purpose fields
  if (!this.purpose && this.bookingPurpose) this.purpose = this.bookingPurpose;
  if (!this.bookingPurpose && this.purpose) this.bookingPurpose = this.purpose;

  // Sync Date fields
  if (!this.bookingDate && this.preferredDate) this.bookingDate = this.preferredDate;
  if (!this.preferredDate && this.bookingDate) this.preferredDate = this.bookingDate;

  // Sync Status fields
  if (!this.status && this.bookingStatus) this.status = this.bookingStatus;
  if (!this.bookingStatus && this.status) this.bookingStatus = this.status;

  // Sync Engineer fields
  if (!this.assignedTechnician && this.assignedEngineer) this.assignedTechnician = this.assignedEngineer;
  if (!this.assignedEngineer && this.assignedTechnician) this.assignedEngineer = this.assignedTechnician;

  // Sync Notes fields
  if (!this.technicianNotes && this.adminNotes) this.technicianNotes = this.adminNotes;
  if (!this.adminNotes && this.technicianNotes) this.adminNotes = this.technicianNotes;

  next();
});

export default mongoose.model("ServiceBooking", serviceBookingSchema);
