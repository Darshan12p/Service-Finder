const mongoose = require("mongoose");

// ================= OPTION SCHEMA =================
const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

// ================= OPTION GROUP SCHEMA =================
const optionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    options: { type: [optionSchema], default: [] },
  },
  { _id: true }
);

// ================= PACKAGE SCHEMA =================
const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // new
    description: { type: String, default: "", trim: true },
    basePrice: { type: Number, default: 0 },

    // old compatibility
    price: { type: Number, default: 0 },

    durationMins: { type: Number, default: 60 },
    features: [{ type: String, default: "" }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // new flexible config
    optionGroups: { type: [optionGroupSchema], default: [] },
  },
  { _id: true }
);

// ================= OFFER SNAPSHOT =================
const offerSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },
    title: { type: String, default: "" },
    code: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    value: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

// ================= SERVICE SCHEMA =================
const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    category: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    packages: { type: [packageSchema], default: [] },

    usageCount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    popularBoost: { type: Number, default: 0 },

    offer: { type: offerSchema, default: () => ({}) },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);