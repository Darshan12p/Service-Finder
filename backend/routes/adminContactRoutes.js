const express = require("express");
const router = express.Router();
const {
  adminGetMessages,
  adminToggleStatus,
  adminDeleteMessage,
} = require("../controllers/contactController");

router.get("/contact-messages", adminGetMessages);
router.patch("/contact-messages/:id/toggle", adminToggleStatus);
router.delete("/contact-messages/:id", adminDeleteMessage);

module.exports = router;
