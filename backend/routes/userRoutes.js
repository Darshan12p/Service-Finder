const router = require("express").Router();
const User = require("../models/User");

/**
 * ✅ GET /api/users/me?userId=xxxx
 * Returns fresh user profile from DB
 */
router.get("/me", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (e) {
    console.error("GET /users/me error:", e);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/**
 * ✅ PATCH /api/users/me?userId=xxxx
 * Update profile fields
 */
router.patch("/me", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const { name, phone } = req.body;

    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Profile updated", user });
  } catch (e) {
    console.error("PATCH /users/me error:", e);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
