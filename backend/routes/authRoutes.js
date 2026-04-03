// backend/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");
const Otp = require("../models/Otp");

const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const { signToken } = require("../utils/jwt");

// ======================= SEND OTP =======================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailLower = email.toLowerCase().trim();

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.create({
      email: emailLower,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendEmail(emailLower, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ======================= VERIFY OTP + LOGIN =======================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const emailLower = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({ email: emailLower }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found. Please request again." });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request again." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpRecord.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP correct -> find or create user
    let user = await User.findOne({ email: emailLower });

    if (!user) {
      user = await User.create({
        email: emailLower,
        isVerified: true,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    user.isVerified = true;
    user.lastLoginAt = new Date();

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (ADMIN_EMAIL && emailLower === ADMIN_EMAIL) {
      user.role = "admin";
    } else {
      if (!user.role) user.role = "customer";
    }

    await user.save();

    await Otp.deleteMany({ email: emailLower });

    // ✅ Generate JWT using shared util
    const token = signToken({ id: user._id.toString(), role: user.role });

    // ✅ Return safe user (don’t send full mongoose doc if you don’t need)
    const safeUser = {
      _id: user._id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    };

    res.json({
      message: "OTP verified successfully",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

module.exports = router;