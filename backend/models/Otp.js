const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true }, // hashed
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true } // ✅ adds createdAt, updatedAt
);

module.exports = mongoose.model("Otp", otpSchema);
