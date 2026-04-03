const express = require("express");
const router = express.Router();

const {
  adminGetOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminToggleOffer,
  adminDeleteOffer,
  adminAssignOfferServices, // ✅ NEW
} = require("../controllers/adminOfferController");

router.get("/", adminGetOffers);
router.post("/", adminCreateOffer);
router.patch("/:id", adminUpdateOffer);
router.patch("/:id/toggle", adminToggleOffer);
router.patch("/:id/services", adminAssignOfferServices); // ✅ NEW
router.delete("/:id", adminDeleteOffer);

module.exports = router;
