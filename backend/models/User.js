const mongoose = require("mongoose");

// ✅ Address Schema (for manual + live GPS)
const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    line1: { type: String, required: true, trim: true },

    houseNo: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    profileImage: { type: String, default: "" },
    // ✅ Live location coordinates
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // ✅ match frontend usage
    source: {
      type: String,
      enum: ["manual", "live", "gps"],
      default: "manual",
    },
  },
  { timestamps: true }
);

// ✅ Partner working slot schema
const PartnerWorkingSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    startTime: { type: String, default: "09:00" }, // 24-hour format
    endTime: { type: String, default: "18:00" },   // 24-hour format
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

// ✅ Partner contact / service profile schema
const PartnerProfileSchema = new mongoose.Schema(
  {
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ✅ whether customer can directly contact this partner
    allowDirectCustomerContact: {
      type: Boolean,
      default: true,
    },

    joinInquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JoinInquiry",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ service mapping
    serviceCategories: {
      type: [String],
      default: [],
    },

    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    // ✅ service areas
    cities: {
      type: [String],
      default: [],
    },

    pincodes: {
      type: [String],
      default: [],
    },

    // ✅ optional exact/current location
    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },

    // ✅ schedule
    workingSlots: {
      type: [PartnerWorkingSlotSchema],
      default: [],
    },

    maxBookingsPerDay: {
      type: Number,
      default: 5,
      min: 1,
    },

    priority: {
      type: Number,
      default: 0,
    },

    // ✅ review summary
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCompletedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ optional experience / UI display
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

// ✅ User Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["customer", "partner", "admin"],
      default: "customer",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    profile: {
      name: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      image: { type: String, default: "" },
    },

    addresses: {
      type: [AddressSchema],
      default: [],
    },

    partner: {
      type: PartnerProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// ✅ helpful indexes for partner assignment
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "partner.isApproved": 1, "partner.isAvailable": 1 });
userSchema.index({ "partner.serviceIds": 1 });
userSchema.index({ "partner.serviceCategories": 1 });
userSchema.index({ "partner.cities": 1 });
userSchema.index({ "partner.pincodes": 1 });

module.exports = mongoose.model("User", userSchema);