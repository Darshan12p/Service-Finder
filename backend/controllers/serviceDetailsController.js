const Service = require("../models/Service");

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizePublicOption = (opt, idx = 0) => {
  if (!opt || opt.isActive === false) return null;

  const label = String(opt.label || opt.name || "").trim();
  if (!label) return null;

  return {
    _id: opt._id,
    label,
    description: String(opt.description || "").trim(),
    price: toNumber(opt.price, 0),
    isActive: opt.isActive !== false,
    sortOrder: toNumber(opt.sortOrder, idx),
  };
};

const normalizePublicGroup = (group, idx = 0) => {
  if (!group) return null;

  const name = String(group.name || "").trim();
  if (!name) return null;

  const options = (Array.isArray(group.options) ? group.options : [])
    .map((opt, oIdx) => normalizePublicOption(opt, oIdx))
    .filter(Boolean)
    .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0));

  return {
    _id: group._id,
    name,
    type: group.type === "multiple" ? "multiple" : "single",
    isRequired: !!group.isRequired,
    sortOrder: toNumber(group.sortOrder, idx),
    options,
  };
};

const normalizePublicPackage = (pkg, idx = 0) => {
  if (!pkg || pkg.isActive === false) return null;

  const name = String(pkg.name || "").trim();
  if (!name) return null;

  const basePrice = toNumber(pkg.basePrice, toNumber(pkg.price, 0));

  return {
    _id: pkg._id,
    name,
    description: String(pkg.description || "").trim(),
    basePrice,
    price: basePrice,
    durationMins: toNumber(pkg.durationMins, 60),
    features: Array.isArray(pkg.features)
      ? pkg.features.map((f) => String(f || "").trim()).filter(Boolean)
      : [],
    isActive: pkg.isActive !== false,
    sortOrder: toNumber(pkg.sortOrder, idx),
    optionGroups: (Array.isArray(pkg.optionGroups) ? pkg.optionGroups : [])
      .map((group, gIdx) => normalizePublicGroup(group, gIdx))
      .filter(Boolean)
      .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0)),
  };
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, isActive: true });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const response = {
      _id: service._id,
      title: service.title,
      category: service.category,
      categoryId: service.categoryId || null,
      price: toNumber(service.price, 0),
      imageUrl: service.imageUrl || "",
      isActive: service.isActive !== false,
      usageCount: toNumber(service.usageCount, 0),
      isPopular: !!service.isPopular,
      popularBoost: toNumber(service.popularBoost, 0),
      avgRating: toNumber(service.avgRating, 0),
      ratingCount: toNumber(service.ratingCount, 0),
      offer: service.offer || {},
      packages: (Array.isArray(service.packages) ? service.packages : [])
        .map((pkg, idx) => normalizePublicPackage(pkg, idx))
        .filter(Boolean)
        .sort((a, b) => toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0)),
    };

    res.json({ service: response });
  } catch (err) {
    console.error("getServiceById error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};