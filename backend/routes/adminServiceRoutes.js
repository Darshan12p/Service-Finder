const router = require("express").Router();
const adminServiceController = require("../controllers/adminServiceController");

// ✅ import correct multer uploader
const { uploadServiceImage } = require("../middlewares/upload");

// GET
router.get("/services", adminServiceController.getServices);

// CREATE (multipart)
router.post(
  "/services",
  uploadServiceImage.single("image"),
  adminServiceController.createService
);

// UPDATE (multipart)
router.put(
  "/services/:id",
  uploadServiceImage.single("image"),
  adminServiceController.updateService
);

// TOGGLE ACTIVE
router.patch("/services/:id/toggle", adminServiceController.toggleService);

// POPULARITY
router.patch("/services/:id/popularity", adminServiceController.updatePopularity);

// DELETE
router.delete("/services/:id", adminServiceController.deleteService);

module.exports = router;
