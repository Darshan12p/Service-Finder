const express = require("express");
const router = express.Router();

const {
  getAdminProfile,
  updateAdminProfile,
} = require("../controllers/adminProfileController");

const { protect, adminOnly } = require("../middlewares/auth");

router.get("/me", protect, adminOnly, getAdminProfile);
router.put("/me", protect, adminOnly, updateAdminProfile);

module.exports = router;