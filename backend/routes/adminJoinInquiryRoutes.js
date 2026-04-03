const express = require("express");
const router = express.Router();

const {
  adminGetJoinInquiries,
  adminUpdateJoinStatus,
  adminDeleteJoinInquiry,
} = require("../controllers/joinInquiryController");

const { protect, adminOnly } = require("../middlewares/auth");

// GET all inquiries
router.get("/join-inquiries", protect, adminOnly, adminGetJoinInquiries);

// APPROVE / REJECT inquiry
router.patch(
  "/join-inquiries/:id/status",
  protect,
  adminOnly,
  adminUpdateJoinStatus
);

// DELETE inquiry
router.delete(
  "/join-inquiries/:id",
  protect,
  adminOnly,
  adminDeleteJoinInquiry
);

module.exports = router;