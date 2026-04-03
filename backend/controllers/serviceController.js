const Service = require("../models/Service");
const Category = require("../models/Category");

// PUBLIC: get active services for user (home + services page)
const getPublicServices = async (req, res) => {
  try {
    const { search = "", category = "All", page = 1, limit = 12 } = req.query;

    const q = { isActive: true };

    // category filter (category stored as STRING)
    if (category && category !== "All") q.category = category;

    // search filter
    if (search && search.trim()) {
      const s = search.trim();
      q.$or = [
        { title: { $regex: s, $options: "i" } },
        { category: { $regex: s, $options: "i" } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Service.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Service.countDocuments(q),
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET SERVICES BY CATEGORY ID (convert id → category name → services)
const getServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const cat = await Category.findById(categoryId);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const services = await Service.find({
      category: cat.name,   // Service.category is STRING
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      services,
      category: cat,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPublicServices,
  getServicesByCategory,
};
