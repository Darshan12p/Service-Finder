const router = require("express").Router();

const Booking = require("../models/Booking");
const { protect } = require("../middlewares/auth");

const {
  createBooking,
  getUserBookingDetails,

  getPartnersForServiceBooking,

  // admin
  getBookings,
  updateBookingStatus,
  deleteBooking,
  getAssignablePartners,
  assignPartnerManually,

  // partner
  getPartnerBookings,
  partnerAcceptBooking,
  partnerRejectBooking,
} = require("../controllers/bookingController");

/**
 * ✅ POST /api/bookings
 * Create booking
 */
router.post("/", createBooking);

/**
 * ✅ GET /api/bookings/admin/all
 * Admin booking list
 */
router.get("/admin/all", protect, getBookings);

/**
 * ✅ PUT /api/bookings/admin/status/:bookingId
 * Admin update booking status
 */
router.put("/admin/status/:bookingId", protect, updateBookingStatus);

/**
 * ✅ DELETE /api/bookings/admin/:bookingId
 * Admin delete booking
 */
router.delete("/admin/:bookingId", protect, deleteBooking);

/**
 * ✅ GET /api/bookings/admin/assignable-partners/:bookingId
 * Admin get partner list for assignment
 */
router.get(
  "/admin/assignable-partners/:bookingId",
  protect,
  getAssignablePartners
);

/**
 * ✅ PUT /api/bookings/admin/assign/:bookingId/:partnerId
 * Admin manual assign/reassign partner
 */
router.put(
  "/admin/assign/:bookingId/:partnerId",
  protect,
  assignPartnerManually
);

/**
 * ✅ GET /api/bookings/user/:userId
 * Use this for MyBookings page
 */
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const authUserId = req.user?.id;
    const requestedUserId = req.params.userId;
    const { tab = "all" } = req.query;

    if (!authUserId || String(authUserId) !== String(requestedUserId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const query = { userId: requestedUserId };

    if (tab === "completed") {
      query.bookingStatus = "Completed";
    } else if (tab === "cancelled") {
      query.bookingStatus = "Cancelled";
    } else if (tab === "upcoming") {
      query.bookingStatus = { $in: ["Pending", "Confirmed"] };
    } else if (tab === "incomplete") {
      query.bookingStatus = { $in: ["Pending", "Confirmed", "Cancelled"] };
    }

    const items = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("serviceId", "title image imageUrl category");

    return res.json({ items });
  } catch (e) {
    console.error("fetch bookings error:", e);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

/**
 * ✅ GET /api/bookings/partner/my
 * Protected: partner can see assigned bookings
 */
router.get("/partner/my", protect, getPartnerBookings);

/**
 * ✅ GET /api/bookings/partners/by-service/:serviceId
 * User side: fetch matching partners for selected service
 * Query optional: city, pincode, date, time
 */
router.get("/partners/by-service/:serviceId", getPartnersForServiceBooking);

/**
 * ✅ GET /api/bookings/:bookingId/details
 * Protected: user can fetch own booking details with assisted partner info
 */
router.get("/:bookingId/details", protect, getUserBookingDetails);

/**
 * ✅ PATCH /api/bookings/:bookingId/partner-accept
 * Protected: assigned partner accepts booking
 */
router.patch("/:bookingId/partner-accept", protect, partnerAcceptBooking);

/**
 * ✅ PATCH /api/bookings/:bookingId/partner-reject
 * Protected: assigned partner rejects booking
 */
router.patch("/:bookingId/partner-reject", protect, partnerRejectBooking);

/**
 * ✅ GET /api/bookings/:id
 * Fetch single booking by id
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const item = await Booking.findById(req.params.id).populate(
      "serviceId",
      "title image imageUrl category"
    );

    if (!item) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const userId = req.user?.id;

    const isOwner = String(item.userId || "") === String(userId);
    const isAssignedPartner =
      String(item.assignedPartnerId || "") === String(userId);

    if (!isOwner && !isAssignedPartner) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.json({ item });
  } catch (e) {
    console.error("fetch booking by id error:", e);
    return res.status(500).json({ message: "Failed to fetch booking" });
  }
});

module.exports = router;