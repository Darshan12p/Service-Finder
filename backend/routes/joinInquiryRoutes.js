const express = require("express");
const router = express.Router();

const { createJoinInquiry } = require("../controllers/joinInquiryController");
const { uploadJoinDocument } = require("../middlewares/upload");
const { protect } = require("../middlewares/auth");

// USER submits join request
router.post(
  "/",
  protect,
  uploadJoinDocument.single("document"),
  createJoinInquiry
);

module.exports = router;