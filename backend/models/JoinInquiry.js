const mongoose = require("mongoose");

const InquiryWorkingSlotSchema = new mongoose.Schema(
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
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "18:00" },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const joinInquirySchema = new mongoose.Schema(
  {
    // link with real user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    dob: { type: String, required: true },

    education: {
      degree: { type: String, default: "" },
      institute: { type: String, default: "" },
      passingYear: { type: String, default: "" },
    },

    professional: {
      experienceYears: { type: String, default: "" },
      currentRole: { type: String, default: "" },
      about: { type: String, default: "" },
    },

    skills: [{ type: String }],

    // selected services
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    // optional readable copy
    serviceCategoryNames: [{ type: String }],

    // service area
    city: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    pincode: { type: String, default: "" },

    // partner availability
    workingSlots: {
      type: [InquiryWorkingSlotSchema],
      default: [],
    },

    documentUrl: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvalNotes: {
      type: String,
      default: "",
    },

    // after approval, which user became partner
    approvedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JoinInquiry", joinInquirySchema);