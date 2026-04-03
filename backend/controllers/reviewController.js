// controllers/reviewController.js
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const User = require("../models/User");

const toObjectIdSafe = (id) => {
  try {
    if (!id) return null;
    if (id instanceof mongoose.Types.ObjectId) return id;
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

/* =========================================================
   HELPERS
========================================================= */

async function recomputeServiceRating(serviceId) {
  const sid = toObjectIdSafe(serviceId);
  if (!sid) return;

  const stats = await Review.aggregate([
    { $match: { service: sid, isVisible: true } },
    {
      $group: {
        _id: "$service",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length ? Number(stats[0].avg.toFixed(2)) : 0;
  const ratingCount = stats.length ? stats[0].count : 0;

  await Service.findByIdAndUpdate(sid, { avgRating, ratingCount });
}

async function recomputePartnerRating(partnerUserId) {
  const pid = toObjectIdSafe(partnerUserId);
  if (!pid) return;

  const stats = await Review.aggregate([
    { $match: { partner: pid, isVisible: true } },
    {
      $group: {
        _id: "$partner",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length ? Number(stats[0].avg.toFixed(2)) : 0;
  const totalReviews = stats.length ? stats[0].count : 0;

  await User.findByIdAndUpdate(pid, {
    $set: {
      "partner.averageRating": averageRating,
      "partner.totalReviews": totalReviews,
    },
  });
}

/* =========================================================
   USER: GET BOOKING REVIEW DATA
   GET /api/reviews/booking/:bookingId
========================================================= */
exports.getBookingForRating = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("serviceId", "title image imageUrl avgRating ratingCount")
      .populate(
        "assignedPartnerId",
        "email profile partner.averageRating partner.totalReviews"
      );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot review a cancelled booking" });
    }

    const existingReview = await Review.findOne({ booking: booking._id });

    const canReview =
      booking.bookingStatus === "Completed" && !!booking.assignedPartnerId;

    return res.json({
      booking,
      canReview,
      existingReview,
    });
  } catch (err) {
    console.error("getBookingForRating error:", err);
    return res.status(500).json({ message: "Failed to fetch booking for rating" });
  }
};

/* =========================================================
   USER: CREATE OR UPDATE REVIEW BY BOOKING
   POST /api/reviews/booking/:bookingId
========================================================= */
exports.createOrUpdateReview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bid = toObjectIdSafe(bookingId);
    if (!bid) {
      return res.status(400).json({ message: "Invalid bookingId" });
    }

    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const c = String(comment || "").trim();
    if (c.length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment cannot exceed 1000 characters" });
    }

    const booking = await Booking.findById(bid)
      .populate("serviceId", "title")
      .populate("assignedPartnerId", "email profile partner")
      .populate("userId", "email profile");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.userId?._id) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You can review only your own booking" });
    }

    if (booking.bookingStatus !== "Completed") {
      return res.status(400).json({
        message: "Review allowed only after booking is completed",
      });
    }

    if (!booking.assignedPartnerId) {
      return res.status(400).json({
        message: "No partner assigned for this booking",
      });
    }

    const customerName =
      booking.customerName ||
      booking.userId?.profile?.name ||
      "";
    const customerEmail =
      booking.customerEmail ||
      booking.userId?.email ||
      "";

    let saved = await Review.findOne({ booking: booking._id });

    if (saved) {
      saved.rating = r;
      saved.comment = c;
      saved.customerName = customerName;
      saved.customerEmail = customerEmail;
      saved.isVisible = true;
      await saved.save();
    } else {
      saved = await Review.create({
        booking: booking._id,
        service: booking.serviceId?._id || booking.serviceId,
        user: booking.userId?._id || booking.userId,
        partner: booking.assignedPartnerId?._id || booking.assignedPartnerId,
        customerName,
        customerEmail,
        rating: r,
        comment: c,
        isVisible: true,
      });
    }

    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        isReviewed: true,
        reviewedAt: new Date(),
      },
    });

    await Promise.all([
      recomputeServiceRating(booking.serviceId?._id || booking.serviceId),
      recomputePartnerRating(
        booking.assignedPartnerId?._id || booking.assignedPartnerId
      ),
    ]);

    const review = await Review.findById(saved._id)
      .populate("service", "title")
      .populate("user", "email profile")
      .populate("partner", "email profile partner.averageRating partner.totalReviews");

    return res.json({
      message: "Review saved successfully",
      review,
    });
  } catch (err) {
    console.log("createOrUpdateReview error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

/* =========================================================
   PUBLIC: GET REVIEWS BY SERVICE
   GET /api/reviews/service/:serviceId
========================================================= */
exports.getReviewsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const sid = toObjectIdSafe(serviceId);

    if (!sid) {
      return res.status(400).json({ message: "Invalid serviceId" });
    }

    const items = await Review.find({
      service: sid,
      isVisible: true,
    })
      .sort({ createdAt: -1 })
      .populate("service", "title")
      .populate("user", "email profile")
      .populate("partner", "email profile partner.averageRating partner.totalReviews");

    return res.json({ items });
  } catch (err) {
    console.log("getReviewsByService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   PUBLIC: GET REVIEWS BY PARTNER
   GET /api/reviews/partner/:partnerId
========================================================= */
exports.getReviewsByPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const pid = toObjectIdSafe(partnerId);

    if (!pid) {
      return res.status(400).json({ message: "Invalid partnerId" });
    }

    const items = await Review.find({
      partner: pid,
      isVisible: true,
    })
      .sort({ createdAt: -1 })
      .populate("service", "title")
      .populate("user", "email profile")
      .populate("partner", "email profile partner.averageRating partner.totalReviews");

    return res.json({ items });
  } catch (err) {
    console.log("getReviewsByPartner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   PUBLIC: LATEST REVIEWS
   GET /api/reviews/latest?limit=3
========================================================= */
exports.getLatestReviews = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 3), 10);

    const items = await Review.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("service", "title")
      .populate("user", "email profile")
      .populate("partner", "email profile partner.averageRating partner.totalReviews");

    return res.json({ items });
  } catch (err) {
    console.log("getLatestReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ADMIN: LIST REVIEWS
   GET /api/admin/reviews
========================================================= */
exports.adminListReviews = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("booking", "customerName customerEmail bookingStatus")
        .populate("service", "title")
        .populate("user", "email profile")
        .populate("partner", "email profile partner.averageRating partner.totalReviews"),
      Review.countDocuments(),
    ]);

    return res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log("adminListReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ADMIN: DELETE REVIEW
   DELETE /api/admin/reviews/:id
========================================================= */
exports.adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const rid = toObjectIdSafe(id);

    if (!rid) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await Review.findById(rid);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const serviceId = review.service;
    const partnerId = review.partner;
    const bookingId = review.booking;

    await Review.findByIdAndDelete(rid);

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          isReviewed: false,
          reviewedAt: null,
        },
      });
    }

    await Promise.all([
      recomputeServiceRating(serviceId),
      recomputePartnerRating(partnerId),
    ]);

    return res.json({ message: "Review deleted" });
  } catch (err) {
    console.log("adminDeleteReview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getReviewsByPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const pid = toObjectIdSafe(partnerId);

    if (!pid) {
      return res.status(400).json({ message: "Invalid partnerId" });
    }

    const items = await Review.find({
      partner: pid,
      isVisible: true,
    })
      .sort({ createdAt: -1 })
      .populate("service", "title")
      .populate("user", "email profile")
      .populate("partner", "email profile partner.averageRating partner.totalReviews");

    return res.json({ items });
  } catch (err) {
    console.log("getReviewsByPartner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
