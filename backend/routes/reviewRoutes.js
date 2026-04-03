const router = require("express").Router();

const {
  createOrUpdateReview,
  getReviewsByService,
  getLatestReviews,
  getBookingForRating,
  getReviewsByPartner,
} = require("../controllers/reviewController");

// ✅ your existing auth middleware
const { protect } = require("../middlewares/auth");

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// reviews by service (for service details page)
router.get("/service/:serviceId", getReviewsByService);

// reviews by partner (NEW 🔥)
router.get("/partner/:partnerId", getReviewsByPartner);

// latest reviews (footer / homepage)
router.get("/latest", getLatestReviews);

/* =========================================================
   USER ROUTES (LOGIN REQUIRED)
========================================================= */

// get booking data for rating page
router.get("/booking/:bookingId", protect, getBookingForRating);

// create/update review (based on booking)
router.post("/booking/:bookingId", protect, createOrUpdateReview);

module.exports = router;


