const User = require("../models/User");

// GET /api/admin/users?role=customer&search=&page=1&limit=20&approved=true|false
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, approved } = req.query;

    const query = {};

    if (role) query.role = role;

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { email: { $regex: s, $options: "i" } },
        { "profile.name": { $regex: s, $options: "i" } },
        { "profile.phone": { $regex: s, $options: "i" } },
        { "profile.city": { $regex: s, $options: "i" } },
        { "partner.serviceCategories": { $regex: s, $options: "i" } },
        { "partner.cities": { $regex: s, $options: "i" } },
        { "partner.pincodes": { $regex: s, $options: "i" } },
      ];
    }

    // only for partners
    if (role === "partner" && approved !== undefined) {
      if (approved === "true") query["partner.isApproved"] = true;
      if (approved === "false") query["partner.isApproved"] = false;
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 20, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      User.countDocuments(query),
    ]);

    return res.json({
      items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    });
  } catch (err) {
    console.error("getUsers error:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
};

// PATCH /api/admin/users/:id/toggle-active
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    return res.json({ message: "User updated", user });
  } catch (err) {
    console.error("toggleActive error:", err);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

// PATCH /api/admin/users/:id/role
// IMPORTANT: do not use this to manually convert users into partner
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ["customer", "partner", "admin"];

    if (!allowed.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // prevent manual customer -> partner conversion
    if (role === "partner" && user.role !== "partner") {
      return res.status(400).json({
        message:
          "Partner role must come from approved Join Inquiry, not manual role change",
      });
    }

    user.role = role;

    // if changing away from partner, safely reset partner approval state
    if (role !== "partner") {
      user.partner = user.partner || {};
      user.partner.isApproved = false;
      user.partner.isAvailable = false;
    }

    await user.save();

    return res.json({ message: "Role updated", user });
  } catch (err) {
    console.error("changeRole error:", err);
    return res.status(500).json({ message: "Failed to update role" });
  }
};

// PATCH /api/admin/users/:id/partner-settings
exports.updatePartnerSettings = async (req, res) => {
  try {
    const {
      isApproved,
      isAvailable,
      serviceCategories,
      serviceIds,
      cities,
      pincodes,
      maxBookingsPerDay,
      priority,
      averageRating,
      totalCompletedJobs,
      workingSlots,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "partner") {
      return res
        .status(400)
        .json({ message: "User is not a service partner" });
    }

    user.partner = user.partner || {};

    if (typeof isApproved === "boolean") {
      user.partner.isApproved = isApproved;
    }

    if (typeof isAvailable === "boolean") {
      user.partner.isAvailable = isAvailable;
    }

    if (Array.isArray(serviceCategories)) {
      user.partner.serviceCategories = serviceCategories
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }

    if (Array.isArray(serviceIds)) {
      user.partner.serviceIds = serviceIds.filter(Boolean);
    }

    if (Array.isArray(cities)) {
      user.partner.cities = cities
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }

    if (Array.isArray(pincodes)) {
      user.partner.pincodes = pincodes
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }

    if (maxBookingsPerDay !== undefined) {
      const n = Number(maxBookingsPerDay);
      user.partner.maxBookingsPerDay = Number.isFinite(n) && n > 0 ? n : 5;
    }

    if (priority !== undefined) {
      const n = Number(priority);
      user.partner.priority = Number.isFinite(n) ? n : 0;
    }

    if (averageRating !== undefined) {
      const n = Number(averageRating);
      user.partner.averageRating = Number.isFinite(n) ? n : 0;
    }

    if (totalCompletedJobs !== undefined) {
      const n = Number(totalCompletedJobs);
      user.partner.totalCompletedJobs = Number.isFinite(n) ? n : 0;
    }

    if (Array.isArray(workingSlots)) {
      user.partner.workingSlots = workingSlots
        .filter((slot) => slot && slot.day)
        .map((slot) => ({
          day: String(slot.day || "").trim(),
          startTime: String(slot.startTime || "09:00").trim(),
          endTime: String(slot.endTime || "18:00").trim(),
          isAvailable:
            typeof slot.isAvailable === "boolean" ? slot.isAvailable : true,
        }));
    }

    await user.save();

    return res.json({
      message: "Partner settings updated successfully",
      user,
    });
  } catch (err) {
    console.error("updatePartnerSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update partner settings" });
  }
};