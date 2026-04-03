const User = require("../models/User");

/**
 * GET /api/admin/profile/me
 * Logged in admin profile
 */
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId).select(
      "_id email role isActive profile createdAt updatedAt"
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    return res.status(200).json({
      message: "Admin profile fetched successfully",
      admin: {
        _id: admin._id,
        email: admin.email || "",
        role: admin.role || "admin",
        isActive: admin.isActive ?? true,
        name: admin.profile?.name || "",
        phone: admin.profile?.phone || "",
        location: admin.profile?.city || "",
        avatar: admin.profile?.image || "",
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("getAdminProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/admin/profile/me
 * Update logged in admin profile
 */
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const {
      name = "",
      phone = "",
      location = "",
      avatar = "",
    } = req.body || {};

    if (!admin.profile) {
      admin.profile = {};
    }

    admin.profile.name = String(name).trim();
    admin.profile.phone = String(phone).trim();
    admin.profile.city = String(location).trim();

    // avatar is stored in profile.image
    if (typeof avatar === "string") {
      admin.profile.image = avatar.trim();
    }

    await admin.save();

    return res.status(200).json({
      message: "Admin profile updated successfully",
      admin: {
        _id: admin._id,
        email: admin.email || "",
        role: admin.role || "admin",
        isActive: admin.isActive ?? true,
        name: admin.profile?.name || "",
        phone: admin.profile?.phone || "",
        location: admin.profile?.city || "",
        avatar: admin.profile?.image || "",
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateAdminProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
};