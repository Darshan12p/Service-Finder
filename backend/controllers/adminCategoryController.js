const Category = require("../models/Category");

// ADMIN: list
const adminGetCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: create
const adminCreateCategory = async (req, res) => {
  try {
    const { name, isActive, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ message: "Category already exists" });

    // ✅ image from multer
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const created = await Category.create({
      name: name.trim(),
      icon: "",                 // ✅ keep empty (you removed icon)
      imageUrl,                 // ✅ store uploaded image url
      isActive: isActive !== "false" && isActive !== false, // handles formdata string
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    });

    res.status(201).json({ message: "Category created", category: created });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: update
const adminUpdateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, sortOrder } = req.body;

    const update = {};

    if (name !== undefined) update.name = name.trim();
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder);

    // ✅ FormData sends "true"/"false" as string
    if (isActive !== undefined) {
      update.isActive = isActive !== "false" && isActive !== false;
    }

    // ✅ if new image uploaded, update imageUrl
    if (req.file) {
      update.imageUrl = `/uploads/${req.file.filename}`;
    }

    // ✅ you removed icon, so optional: remove it entirely OR force blank
    // update.icon = "";

    const saved = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!saved) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", category: saved });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: delete
const adminDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: toggle
const adminToggleCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    cat.isActive = !cat.isActive;
    await cat.save();

    res.json({ message: "Category status updated", category: cat });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminToggleCategory,
};
