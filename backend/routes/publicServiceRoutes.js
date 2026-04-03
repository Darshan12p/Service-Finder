const router = require("express").Router();
const Service = require("../models/Service");

// GET /api/services (public list)
router.get("/services", async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Service.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Service.countDocuments({ isActive: true }),
    ]);

    res.json({ items, total });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// GET /api/services/by-category/:categoryId
router.get("/services/by-category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const services = await Service.find({ categoryId, isActive: true }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch services by category" });
  }
});

// GET /api/service/:id (single service with packages)
router.get("/service/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ service });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch service" });
  }
});

// GET /api/packages/service/:serviceId (packages only)
router.get("/packages/service/:serviceId", async (req, res) => {
  try {
    const s = await Service.findById(req.params.serviceId).select("packages");
    if (!s) return res.status(404).json({ message: "Service not found" });

    const pkgs = (s.packages || []).filter((p) => p.isActive !== false);
    res.json(pkgs);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

module.exports = router;
