const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markPaymentFailed,
} = require("../controllers/paymentController");

// add auth middleware if you already use it
router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);
router.post("/failed", markPaymentFailed);

module.exports = router;