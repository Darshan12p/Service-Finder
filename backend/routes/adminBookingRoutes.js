const express = require("express");
const router = express.Router();

const {
  getBookings,
  createBooking,
  updateBookingStatus,
  deleteBooking,
  getAssignablePartners,
  assignPartnerManually,
} = require("../controllers/adminBookingController");

router.get("/bookings", getBookings);
router.post("/bookings", createBooking);
router.patch("/bookings/:id/status", updateBookingStatus);
router.delete("/bookings/:id", deleteBooking);

// NEW: get matching partners for a booking
router.get("/bookings/:id/partners", getAssignablePartners);

// NEW: manual assign / reassign partner
router.patch("/bookings/:id/assign-partner", assignPartnerManually);

module.exports = router;