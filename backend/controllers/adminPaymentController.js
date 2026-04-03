const Booking = require("../models/Booking");

const getAdminPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const search = String(req.query.search || "").trim();
    const method = String(req.query.method || "all").trim();
    const status = String(req.query.status || "all").trim();

    const mongoQuery = {
      $or: [
        { razorpayPaymentId: { $exists: true, $ne: "" } },
        { razorpayOrderId: { $exists: true, $ne: "" } },
        { paymentStatus: "Paid" },
        { paymentStatus: "Failed" },
        { paymentStatus: "Refunded" },
      ],
    };

    if (method !== "all") {
      mongoQuery.paymentMethod = method;
    }

    if (status !== "all") {
      mongoQuery.paymentStatus = status;
    }

    let bookings = await Booking.find(mongoQuery)
      .populate("userId", "name phone mobile email")
      .populate("serviceId", "title name")
      .sort({ createdAt: -1 });

    let rows = bookings.map((b) => {
      const userName = b?.userId?.name || b?.customerName || "Unknown User";
      const mobile = b?.userId?.phone || b?.userId?.mobile || b?.phone || "N/A";
      const service =
        b?.serviceTitle || b?.serviceId?.title || b?.serviceId?.name || "N/A";
      const txnId = b?.razorpayPaymentId || b?.razorpayOrderId || "N/A";

      return {
        _id: b._id,
        user: userName,
        txnId,
        mobile,
        service,
        amount: Number(b?.amount || 0),
        method: b?.paymentMethod || "N/A",
        paymentStatus: b?.paymentStatus || "Unpaid",
        createdAt: b?.createdAt,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((item) => {
        return (
          String(item.user).toLowerCase().includes(s) ||
          String(item.txnId).toLowerCase().includes(s) ||
          String(item.mobile).toLowerCase().includes(s) ||
          String(item.service).toLowerCase().includes(s) ||
          String(item.method).toLowerCase().includes(s) ||
          String(item.paymentStatus).toLowerCase().includes(s)
        );
      });
    }

    const total = rows.length;
    const pages = Math.max(Math.ceil(total / limit), 1);
    const startIndex = (page - 1) * limit;
    const paginatedRows = rows.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      items: paginatedRows,
      total,
      page,
      pages,
      limit,
    });
  } catch (error) {
    console.error("getAdminPayments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment records",
    });
  }
};

module.exports = { getAdminPayments };