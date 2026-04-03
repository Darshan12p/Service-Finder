const Category = require("../models/Category");

// PUBLIC: only active categories
const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getPublicCategories };
