const router = require("express").Router();
const { adminListReviews, adminDeleteReview } = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middlewares/auth"); // adjust if different

router.get("/reviews", protect, adminOnly, adminListReviews);
router.delete("/reviews/:id", protect, adminOnly, adminDeleteReview);

module.exports = router;