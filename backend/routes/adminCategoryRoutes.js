const router = require("express").Router();
const {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminToggleCategory,
} = require("../controllers/adminCategoryController");

// ✅ CORRECT IMPORT
const { uploadCategoryImage } = require("../middlewares/upload");

// GET all categories
router.get("/", adminGetCategories);

// CREATE category (multipart)
router.post(
  "/",
  uploadCategoryImage.single("image"),
  adminCreateCategory
);

// UPDATE category (multipart)
router.patch(
  "/:id",
  uploadCategoryImage.single("image"),
  adminUpdateCategory
);

// TOGGLE active/inactive
router.patch("/:id/toggle", adminToggleCategory);

// DELETE
router.delete("/:id", adminDeleteCategory);

module.exports = router;
