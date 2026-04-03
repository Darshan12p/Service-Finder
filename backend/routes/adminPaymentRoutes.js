const express = require("express");
const router = express.Router();

const { getAdminPayments } = require("../controllers/adminPaymentController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", protect, adminOnly, getAdminPayments);

module.exports = router;