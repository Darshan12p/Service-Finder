// backend/controllers/authController.js
const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/jwt");

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, city } = req.body;

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

    await Otp.deleteMany({ email: emailLower });

    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "").trim();
    const cleanCity = String(city || "").trim();

    let user = await User.findOne({ email: emailLower });

    if (!user) {
      user = await User.create({
        email: emailLower,
        isVerified: true,
        role: "customer",
        profile: {
          name: cleanName,
          phone: cleanPhone,
          city: cleanCity,
        },
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    user.isVerified = true;

    // keep admin unchanged, otherwise default to customer
    if (!user.role) user.role = "customer";
    if (user.role !== "admin" && user.role !== "partner") {
      user.role = "customer";
    }

    user.profile = user.profile || {};

    // fill missing profile fields only
    if (!user.profile.name && cleanName) user.profile.name = cleanName;
    if (!user.profile.phone && cleanPhone) user.profile.phone = cleanPhone;
    if (!user.profile.city && cleanCity) user.profile.city = cleanCity;

    await user.save();

    const token = signToken({ id: user._id.toString(), role: user.role });

    const safeUser = {
      _id: user._id,
      name: user.profile?.name || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: {
        name: user.profile?.name || "",
        phone: user.profile?.phone || "",
        city: user.profile?.city || "",
      },
    };

    return res.json({
      message: "OTP verified successfully",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};