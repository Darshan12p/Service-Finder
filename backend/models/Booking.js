const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    houseNo: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, default: "Ahmedabad" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    source: {
      type: String,
      enum: ["manual", "gps", "live", ""],
      default: "",
    },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true }, // "09:00" / "13:00"
  },
  { _id: false }
);

const selectedOptionSchema = new mongoose.Schema(
  {
    groupId: { type: String, default: "" },
    groupName: { type: String, default: "" },

    optionId: { type: String, default: "" },
    optionLabel: { type: String, default: "" },
    optionDescription: { type: String, default: "" },

    price: { type: Number, default: 0 },
  },
  { _id: false }
);

// partner snapshot
const assignedPartnerSnapshotSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    city: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    // ===============================
    // CUSTOMER
    // ===============================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, default: "", trim: true },

    // ===============================
    // SERVICE
    // ===============================
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    serviceTitle: { type: String, required: true, trim: true },
    serviceCategory: { type: String, required: true, trim: true },

    // ===============================
    // PACKAGE
    // ===============================
    packageId: { type: String, default: "", trim: true },
    packageName: { type: String, required: true, trim: true },

    packagePrice: { type: Number, default: 0 }, // old/basic support
    basePrice: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    durationMins: { type: Number, default: 0 },

    // ===============================
    // SELECTED OPTIONS
    // ===============================
    selectedOptions: { type: [selectedOptionSchema], default: [] },
    selectedOptionsMap: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ===============================
    // ADDRESS & SLOT
    // ===============================
    address: { type: addressSchema, required: true },
    slot: { type: slotSchema, required: true },

    // ===============================
    // PAYMENT
    // ===============================
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Razorpay"],
      required: true,
      default: "Razorpay",
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Failed", "Refunded"],
      default: "Unpaid",
      index: true,
    },

    amount: { type: Number, default: 0 },

    // Razorpay fields
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: "",
      trim: true,
    },

    // optional tracking
    paymentGateway: {
      type: String,
      enum: ["", "Razorpay"],
      default: "Razorpay",
    },
    paymentAttemptedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundId: {
      type: String,
      default: "",
      trim: true,
    },

    // ===============================
    // BOOKING STATUS
    // ===============================
    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    // ===============================
    // PARTNER ASSIGNMENT
    // ===============================
    assignedPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedPartnerName: { type: String, default: "", trim: true },
    assignedPartnerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    assignedPartnerPhone: { type: String, default: "", trim: true },
    assignedPartnerCity: { type: String, default: "", trim: true },
    assignedPartnerImage: { type: String, default: "" },

    assignedPartnerSnapshot: {
      type: assignedPartnerSnapshotSchema,
      default: () => ({}),
    },

    assignmentStatus: {
      type: String,
      enum: ["Unassigned", "Assigned", "Accepted", "Rejected", "Reassigned"],
      default: "Unassigned",
      index: true,
    },

    assignmentMethod: {
      type: String,
      enum: ["Auto", "Manual", "UserSelected", ""],
      default: "",
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    partnerResponseStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", ""],
      default: "",
    },

    partnerResponseAt: {
      type: Date,
      default: null,
    },

    reassignedCount: {
      type: Number,
      default: 0,
    },

    contactPartnerEnabled: {
      type: Boolean,
      default: false,
    },

    partnerDetailsViewedAt: {
      type: Date,
      default: null,
    },

    // ✅ review helper flag (optional but useful)
    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// ===============================
// INDEXES
// ===============================
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ assignedPartnerId: 1, createdAt: -1 });
bookingSchema.index({ serviceId: 1, "slot.date": 1 });
bookingSchema.index({ assignmentStatus: 1, bookingStatus: 1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ razorpayOrderId: 1 });
bookingSchema.index({ userId: 1, bookingStatus: 1, isReviewed: 1 });
bookingSchema.index({ assignedPartnerId: 1, bookingStatus: 1 });

// ===============================
// EXPORT
// ===============================
module.exports = mongoose.model("Booking", bookingSchema);