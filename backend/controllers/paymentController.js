const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Booking = require("../models/Booking");

// CREATE ORDER FOR AN EXISTING BOOKING
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "title image imageUrl category"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (userId && String(booking.userId || "") !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Booking already paid" });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res.status(400).json({
        message: "Cannot create payment order for cancelled booking",
      });
    }

    const amountInPaise = Math.round(Number(booking.amount || 0) * 100);

    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${String(booking._id).slice(-10)}`,
      notes: {
        bookingId: String(booking._id),
        customerName: booking.customerName || "",
        customerEmail: booking.customerEmail || "",
        serviceTitle:
          booking.serviceTitle ||
          booking?.serviceId?.title ||
          "Service Booking",
      },
    });

    booking.razorpayOrderId = order.id;
    booking.paymentMethod = "Razorpay";
    booking.paymentGateway = "Razorpay";
    booking.paymentAttemptedAt = new Date();

    // keep amount synced for admin page
    booking.amount = Number(booking.amount || booking.finalPrice || booking.basePrice || 0);

    await booking.save();

    return res.json({
      success: true,
      message: "Razorpay order created successfully",
      key: process.env.RAZORPAY_KEY_ID,
      order,
      booking: {
        _id: booking._id,
        amount: booking.amount,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        phone: booking.phone || "",
        serviceTitle:
          booking.serviceTitle ||
          booking?.serviceId?.title ||
          "Service Booking",
      },
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create Razorpay order",
    });
  }
};

// VERIFY PAYMENT
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "All Razorpay payment fields are required",
      });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "title image imageUrl category"
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (userId && String(booking.userId || "") !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (!booking.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "No Razorpay order found for this booking",
      });
    }

    if (String(booking.razorpayOrderId) !== String(razorpay_order_id)) {
      booking.paymentStatus = "Failed";
      booking.paymentAttemptedAt = new Date();
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Razorpay order id mismatch",
      });
    }

    const body = `${booking.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
      .update(body)
      .digest("hex");

    console.log("VERIFY DEBUG =>");
    console.log("bookingId:", bookingId);
    console.log("saved order id:", booking.razorpayOrderId);
    console.log("frontend order id:", razorpay_order_id);
    console.log("payment id:", razorpay_payment_id);
    console.log("frontend signature:", razorpay_signature);
    console.log("expected signature:", expectedSignature);

    if (expectedSignature !== razorpay_signature) {
      booking.paymentMethod = "Razorpay";
      booking.paymentGateway = "Razorpay";
      booking.paymentStatus = "Failed";
      booking.paymentAttemptedAt = new Date();
      booking.razorpayPaymentId = razorpay_payment_id || "";
      booking.razorpaySignature = razorpay_signature || "";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    booking.paymentMethod = "Razorpay";
    booking.paymentGateway = "Razorpay";
    booking.paymentStatus = "Paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentAttemptedAt = new Date();
    booking.paidAt = new Date();

    // keep amount safe and synced
    booking.amount = Number(booking.amount || booking.finalPrice || booking.basePrice || 0);

    if (booking.bookingStatus === "Pending") {
      booking.bookingStatus = "Confirmed";
    }

    await booking.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
      booking,
    });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to verify payment",
    });
  }
};

// OPTIONAL: if checkout fails/cancelled
exports.markPaymentFailed = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus !== "Paid") {
      booking.paymentMethod = "Razorpay";
      booking.paymentGateway = "Razorpay";
      booking.paymentStatus = "Failed";
      booking.paymentAttemptedAt = new Date();
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment marked as failed",
    });
  } catch (error) {
    console.error("markPaymentFailed error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark payment as failed",
      error: error.message,
    });
  }
};