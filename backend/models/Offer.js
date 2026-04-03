const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    value: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // ✅ NEW: which services have this offer
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
