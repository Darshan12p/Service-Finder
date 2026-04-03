const Service = require("../models/Service");

/**
 * helper: convert FormData string booleans to real boolean
 */
const toBool = (v, defaultVal = false) => {
  if (v === undefined || v === null) return defaultVal;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  if (s === "true") return true;
  if (s === "false") return false;
  return defaultVal;
};

/**
 * helper: safe number
 */
const toNumber = (v, defaultVal = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultVal;
};

/**
 * helper: safe JSON parse for packages
 */
const parsePackages = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

/**
 * normalize option
 */
const normalizeOption = (opt, index = 0) => {
  const label = String(opt?.label || opt?.name || "").trim();
  if (!label) return null;

  return {
    label,
    description: String(opt?.description || "").trim(),
    price: toNumber(opt?.price, 0),
    isActive: opt?.isActive !== false,
    sortOrder: toNumber(opt?.sortOrder, index),
  };
};

/**
 * normalize option group
 */
const normalizeOptionGroup = (group, index = 0) => {
  const name = String(group?.name || "").trim();
  if (!name) return null;

  const rawOptions = Array.isArray(group?.options) ? group.options : [];
  const options = rawOptions
    .map((opt, idx) => normalizeOption(opt, idx))
    .filter(Boolean)
    .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0));

  return {
    name,
    type: group?.type === "multiple" ? "multiple" : "single",
    isRequired: !!group?.isRequired,
    sortOrder: toNumber(group?.sortOrder, index),
    options,
  };
};

/**
 * normalize package
 */
const normalizePackage = (pkg, index = 0) => {
  const name = String(pkg?.name || `Package ${index + 1}`).trim();

  const basePrice = toNumber(
    pkg?.basePrice,
    toNumber(pkg?.price, 0)
  );

  const rawGroups = Array.isArray(pkg?.optionGroups) ? pkg.optionGroups : [];
  const optionGroups = rawGroups
    .map((group, idx) => normalizeOptionGroup(group, idx))
    .filter(Boolean)
    .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0));

  return {
    name,
    description: String(pkg?.description || "").trim(),
    basePrice,
    price: basePrice, // compatibility with old frontend/backend
    durationMins: toNumber(pkg?.durationMins, 60),
    features: Array.isArray(pkg?.features)
      ? pkg.features.map((f) => String(f || "").trim()).filter(Boolean)
      : [],
    isActive: pkg?.isActive !== false,
    sortOrder: toNumber(pkg?.sortOrder, index),
    optionGroups,
  };
};

/**
 * GET /api/admin/services?search=&category=&status=&page=&limit=
 */
exports.getServices = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (category && category !== "All") query.category = category;

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (search) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { category: { $regex: s, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Service.find(query)
        .sort({ isPopular: -1, popularBoost: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Service.countDocuments(query),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getServices error:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

/**
 * POST /api/admin/services (multipart)
 * Fields: title, category, price, isActive, isPopular, popularBoost, packages(JSON)
 * File: image (optional)
 */
exports.createService = async (req, res) => {
  try {
    const { title, category, price, isActive, isPopular, popularBoost, packages } =
      req.body;

    if (!title || !title.trim() || !category || !category.trim()) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    const imageUrl = req.file ? `/uploads/services/${req.file.filename}` : "";

    const parsedPackages = parsePackages(packages);
    const normalizedPackages = parsedPackages
      .map((pkg, idx) => normalizePackage(pkg, idx))
      .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0));

    const service = await Service.create({
      title: title.trim(),
      category: category.trim(),
      price: toNumber(price, 0),
      imageUrl,

      isActive: toBool(isActive, true),
      isPopular: toBool(isPopular, false),
      popularBoost: toNumber(popularBoost, 0),

      usageCount: 0,
      packages: normalizedPackages,
    });

    res.status(201).json({ message: "Service created", service });
  } catch (err) {
    console.error("createService error:", err);
    res.status(500).json({ message: "Failed to create service" });
  }
};

/**
 * PUT /api/admin/services/:id (multipart)
 * Fields: title, category, price, isActive, isPopular, popularBoost, packages(JSON)
 * File: image (optional)
 */
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, isActive, isPopular, popularBoost, packages } =
      req.body;

    const update = {};

    if (title !== undefined) update.title = String(title).trim();
    if (category !== undefined) update.category = String(category).trim();
    if (price !== undefined) update.price = toNumber(price, 0);

    if (isActive !== undefined) update.isActive = toBool(isActive, true);
    if (isPopular !== undefined) update.isPopular = toBool(isPopular, false);
    if (popularBoost !== undefined) update.popularBoost = toNumber(popularBoost, 0);

    if (packages !== undefined) {
      const parsedPackages = parsePackages(packages);
      update.packages = parsedPackages
        .map((pkg, idx) => normalizePackage(pkg, idx))
        .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0));
    }

    if (req.file) {
      update.imageUrl = `/uploads/services/${req.file.filename}`;
    }

    const updated = await Service.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: "Service not found" });

    res.json({ message: "Service updated", service: updated });
  } catch (err) {
    console.error("updateService error:", err);
    res.status(500).json({ message: "Failed to update service" });
  }
};

/**
 * PATCH /api/admin/services/:id/toggle
 */
exports.toggleService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.isActive = !service.isActive;
    await service.save();

    res.json({ message: "Service status changed", service });
  } catch (err) {
    console.error("toggleService error:", err);
    res.status(500).json({ message: "Failed to toggle service" });
  }
};

/**
 * PATCH /api/admin/services/:id/popularity
 * Body: { isPopular: true/false, popularBoost: number }
 */
exports.updatePopularity = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPopular, popularBoost } = req.body;

    const update = {};
    if (isPopular !== undefined) update.isPopular = toBool(isPopular, false);
    if (popularBoost !== undefined) update.popularBoost = toNumber(popularBoost, 0);

    const updated = await Service.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: "Service not found" });

    res.json({ message: "Popularity updated", service: updated });
  } catch (err) {
    console.error("updatePopularity error:", err);
    res.status(500).json({ message: "Failed to update popularity" });
  }
};

/**
 * DELETE /api/admin/services/:id
 */
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });

    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("deleteService error:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
};