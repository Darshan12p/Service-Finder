const express = require("express");
const router = express.Router();

const {
  getPublicServices,
  getServicesByCategory,
} = require("../controllers/serviceController");

const {
  getPopularServices,
  getPackagesByService,
} = require("../controllers/servicePublicController");

const { getServiceById } = require("../controllers/serviceDetailsController");

// ✅ PUBLIC
router.get("/", getPublicServices);
router.get("/popular", getPopularServices);

// ✅ MUST BE ABOVE "/:id"
router.get("/by-category/:categoryId", getServicesByCategory);

// ✅ Packages by serviceId
// GET /api/services/packages/service/:serviceId
router.get("/packages/service/:serviceId", getPackagesByService);

// ✅ Service details
router.get("/:id", getServiceById);

module.exports = router;