const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Offer = require("../models/Offer");
const User = require("../models/User");

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ---------------- date helpers ---------------- */

function getDateRange(range) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "year") {
    start.setMonth(0, 1); // Jan 1
    start.setHours(0, 0, 0, 0);

    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // default week = last 7 days including today
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function slotDateExpr() {
  return {
    $ifNull: ["$slot.date", "$createdAt"],
  };
}

function getWeekRevenueData(map) {
  return [
    { day: "Mon", value: map.get("Mon") || 0 },
    { day: "Tue", value: map.get("Tue") || 0 },
    { day: "Wed", value: map.get("Wed") || 0 },
    { day: "Thu", value: map.get("Thu") || 0 },
    { day: "Fri", value: map.get("Fri") || 0 },
    { day: "Sat", value: map.get("Sat") || 0 },
    { day: "Sun", value: map.get("Sun") || 0 },
  ];
}

exports.getDashboardSummary = async (req, res) => {
  try {
    const range = req.query.range || "week";
    const { start, end } = getDateRange(range);

    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ isActive: true });
    const activeOffers = await Offer.countDocuments({ isActive: true });
    const activePartners = await User.countDocuments({
      role: "partner",
      isActive: true,
    });

    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({
      bookingStatus: "Pending",
    });

    // ---------------- FILTERED BOOKINGS ----------------
    const filteredBookingsAgg = await Booking.aggregate([
      {
        $addFields: {
          bookingDateObj: slotDateExpr(),
        },
      },
      {
        $match: {
          bookingDateObj: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const filteredBookings = Number(filteredBookingsAgg[0]?.count || 0);

    // ---------------- REVENUE DATA ----------------
    let revenueData = [];

    const revenueBaseStages = [
      {
        $addFields: {
          bookingDateObj: slotDateExpr(),
          amountNumber: {
            $convert: {
              input: { $ifNull: ["$amount", 0] },
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      {
        $match: {
          bookingDateObj: { $gte: start, $lte: end },
          // paymentStatus: "Paid", // enable later if your DB has exact Paid values
        },
      },
    ];

    if (range === "year") {
      const revenueAgg = await Booking.aggregate([
        ...revenueBaseStages,
        {
          $group: {
            _id: { $month: "$bookingDateObj" },
            value: { $sum: "$amountNumber" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const revenueMap = new Map();
      for (const row of revenueAgg) {
        revenueMap.set(MONTH_LABELS[row._id - 1], row.value);
      }

      revenueData = MONTH_LABELS.map((m) => ({
        month: m,
        value: revenueMap.get(m) || 0,
      }));
    } else if (range === "month") {
      const revenueAgg = await Booking.aggregate([
        ...revenueBaseStages,
        {
          $group: {
            _id: { $dayOfMonth: "$bookingDateObj" },
            value: { $sum: "$amountNumber" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const revenueMap = new Map();
      for (const row of revenueAgg) {
        revenueMap.set(String(row._id), row.value);
      }

      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
      ).getDate();

      revenueData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: String(i + 1),
        value: revenueMap.get(String(i + 1)) || 0,
      }));
    } else {
      const revenueAgg = await Booking.aggregate([
        ...revenueBaseStages,
        {
          $group: {
            _id: { $dayOfWeek: "$bookingDateObj" },
            value: { $sum: "$amountNumber" },
          },
        },
      ]);

      const revenueMap = new Map();
      for (const row of revenueAgg) {
        const label = DAY_LABELS[row._id - 1];
        revenueMap.set(label, row.value);
      }

      revenueData = getWeekRevenueData(revenueMap);
    }

    const totalRevenue = revenueData.reduce(
      (sum, d) => sum + Number(d.value || 0),
      0,
    );

    // ---------------- TOP SERVICES ----------------
    const topServicesAgg = await Booking.aggregate([
      {
        $addFields: {
          bookingDateObj: slotDateExpr(),
        },
      },
      {
        $match: {
          bookingDateObj: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$serviceCategory",
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 6 },
    ]);

    const topServices = topServicesAgg.map((x) => ({
      name: x._id || "Unknown",
      value: x.value,
    }));

    // ---------------- CITY DATA ----------------
    let cityData = [];

    if (range === "year") {
      const cityAgg = await Booking.aggregate([
        {
          $addFields: {
            bookingDateObj: slotDateExpr(),
          },
        },
        {
          $match: {
            bookingDateObj: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$bookingDateObj" },
              city: "$address.city",
            },
            value: { $sum: 1 },
          },
        },
      ]);

      const cityByMonth = {};
      MONTH_LABELS.forEach((m) => {
        cityByMonth[m] = { Ahmedabad: 0, Rajkot: 0 };
      });

      for (const row of cityAgg) {
        const monthLabel = MONTH_LABELS[row._id.month - 1];
        const city = row._id.city;
        if (monthLabel && (city === "Ahmedabad" || city === "Rajkot")) {
          cityByMonth[monthLabel][city] = row.value;
        }
      }

      cityData = MONTH_LABELS.map((m) => ({
        month: m,
        ...cityByMonth[m],
      }));
    } else if (range === "month") {
      const cityAgg = await Booking.aggregate([
        {
          $addFields: {
            bookingDateObj: slotDateExpr(),
          },
        },
        {
          $match: {
            bookingDateObj: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$bookingDateObj" },
              city: "$address.city",
            },
            value: { $sum: 1 },
          },
        },
      ]);

      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
      ).getDate();

      const cityByDay = {};
      for (let i = 1; i <= daysInMonth; i++) {
        cityByDay[String(i)] = { Ahmedabad: 0, Rajkot: 0 };
      }

      for (const row of cityAgg) {
        const dayLabel = String(row._id.day);
        const city = row._id.city;
        if (
          cityByDay[dayLabel] &&
          (city === "Ahmedabad" || city === "Rajkot")
        ) {
          cityByDay[dayLabel][city] = row.value;
        }
      }

      cityData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: String(i + 1),
        ...cityByDay[String(i + 1)],
      }));
    } else {
      const cityAgg = await Booking.aggregate([
        {
          $addFields: {
            bookingDateObj: slotDateExpr(),
          },
        },
        {
          $match: {
            bookingDateObj: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfWeek: "$bookingDateObj" },
              city: "$address.city",
            },
            value: { $sum: 1 },
          },
        },
      ]);

      const cityByDay = {
        Mon: { Ahmedabad: 0, Rajkot: 0 },
        Tue: { Ahmedabad: 0, Rajkot: 0 },
        Wed: { Ahmedabad: 0, Rajkot: 0 },
        Thu: { Ahmedabad: 0, Rajkot: 0 },
        Fri: { Ahmedabad: 0, Rajkot: 0 },
        Sat: { Ahmedabad: 0, Rajkot: 0 },
        Sun: { Ahmedabad: 0, Rajkot: 0 },
      };

      for (const row of cityAgg) {
        const dayLabel = DAY_LABELS[row._id.day - 1];
        const city = row._id.city;
        if (
          dayLabel &&
          cityByDay[dayLabel] &&
          (city === "Ahmedabad" || city === "Rajkot")
        ) {
          cityByDay[dayLabel][city] = row.value;
        }
      }

      cityData = [
        { day: "Mon", ...cityByDay.Mon },
        { day: "Tue", ...cityByDay.Tue },
        { day: "Wed", ...cityByDay.Wed },
        { day: "Thu", ...cityByDay.Thu },
        { day: "Fri", ...cityByDay.Fri },
        { day: "Sat", ...cityByDay.Sat },
        { day: "Sun", ...cityByDay.Sun },
      ];
    }

    // ---------------- TOP PARTNERS ----------------
    const topPartnersAgg = await Booking.aggregate([
      {
        $addFields: {
          bookingDateObj: slotDateExpr(),
        },
      },
      {
        $match: {
          bookingDateObj: { $gte: start, $lte: end },
          bookingStatus: { $in: ["Completed", "completed"] },
          partnerId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$partnerId",
          completed: { $sum: 1 },
          name: { $first: "$partnerName" },
          category: { $first: "$serviceCategory" },
        },
      },
      { $sort: { completed: -1 } },
      { $limit: 5 },
    ]);

    const topPartners = topPartnersAgg.map((p) => ({
      _id: p._id,
      name: p.name || "Partner",
      category: p.category || "Service Partner",
      completed: p.completed || 0,
    }));

    return res.json({
      counts: {
        totalBookings,
        filteredBookings,
        pendingBookings,
        totalUsers,
        totalServices,
        activeServices,
        activeOffers,
        activePartners,
        totalRevenue,
      },
      charts: {
        revenueData,
        serviceData: topServices,
        cityData,
        topPartners,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Dashboard summary failed" });
  }
};