const Booking = require("../models/Booking");
const User = require("../models/User");

// helper: normalize string
const norm = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

// helper: get weekday name from date
const getDayName = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

// helper: convert "09:30" OR "09:30 AM" to minutes
const timeToMinutes = (timeStr = "") => {
  const raw = String(timeStr).trim().toUpperCase();
  if (!raw) return null;

  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (match12) {
    let hh = Number(match12[1]);
    const mm = Number(match12[2]);
    const period = match12[3];

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    if (period === "AM" && hh === 12) hh = 0;
    if (period === "PM" && hh !== 12) hh += 12;

    return hh * 60 + mm;
  }

  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hh = Number(match24[1]);
    const mm = Number(match24[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  }

  return null;
};

// helper: flexible category match
const isCategoryMatch = (bookingCategory, partnerCategories = []) => {
  const bookingCat = norm(bookingCategory);
  if (!bookingCat) return false;

  const cats = Array.isArray(partnerCategories)
    ? partnerCategories.map(norm).filter(Boolean)
    : [];

  // if partner has no categories configured, do not fully block
  if (!cats.length) return true;

  return cats.some((cat) => {
    return (
      cat === bookingCat || bookingCat.includes(cat) || cat.includes(bookingCat)
    );
  });
};

// helper: exact service match
const isServiceMatch = (serviceId, partnerServiceIds = []) => {
  if (!serviceId) return false;

  const ids = Array.isArray(partnerServiceIds)
    ? partnerServiceIds.map((id) => String(id))
    : [];

  if (!ids.length) return false;

  return ids.includes(String(serviceId));
};

// helper: location match
const getLocationMatchScore = (partner, city, pincode) => {
  const cities = Array.isArray(partner?.partner?.cities)
    ? partner.partner.cities.map(norm)
    : [];

  const pincodes = Array.isArray(partner?.partner?.pincodes)
    ? partner.partner.pincodes.map((p) => String(p).trim())
    : [];

  const normalizedBookingCity = norm(city);
  const normalizedBookingPincode = String(pincode || "").trim();

  const hasPartnerLocationConfig = cities.length > 0 || pincodes.length > 0;

  const cityMatch = normalizedBookingCity
    ? cities.some(
        (c) =>
          c === normalizedBookingCity ||
          normalizedBookingCity.includes(c) ||
          c.includes(normalizedBookingCity)
      )
    : false;

  const pincodeMatch = normalizedBookingPincode
    ? pincodes.includes(normalizedBookingPincode)
    : false;

  if (cityMatch && pincodeMatch) return 4;
  if (pincodeMatch) return 3;
  if (cityMatch) return 2;

  // fallback only if partner has no location setup
  if (!hasPartnerLocationConfig) return 1;

  return 0;
};

// helper: check if partner works on selected slot
const isPartnerWorkingInSlot = (partner, bookingDate, bookingTime) => {
  const workingSlots = Array.isArray(partner?.partner?.workingSlots)
    ? partner.partner.workingSlots
    : [];

  // if no working slots configured, allow by default
  if (!workingSlots.length) return true;

  const dayName = getDayName(bookingDate);
  if (!dayName) return false;

  const selectedMinutes = timeToMinutes(bookingTime);
  if (selectedMinutes === null) return false;

  const todaySlot = workingSlots.find(
    (slot) => norm(slot?.day) === norm(dayName)
  );

  if (!todaySlot) return false;
  if (todaySlot.isAvailable === false) return false;

  const start = timeToMinutes(todaySlot.startTime || "09:00");
  const end = timeToMinutes(todaySlot.endTime || "18:00");

  if (start === null || end === null) return true;

  return selectedMinutes >= start && selectedMinutes <= end;
};

// helper: count partner bookings for selected day
const getPartnerLoadForDate = async (partnerId, bookingDate) => {
  const start = new Date(bookingDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(bookingDate);
  end.setHours(23, 59, 59, 999);

  const count = await Booking.countDocuments({
    assignedPartnerId: partnerId,
    "slot.date": { $gte: start, $lte: end },
    bookingStatus: { $in: ["Pending", "Confirmed"] },
    assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
  });

  return count;
};

// helper: check exact slot clash
const hasSameSlotBooking = async (partnerId, bookingDate, bookingTime) => {
  const start = new Date(bookingDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(bookingDate);
  end.setHours(23, 59, 59, 999);

  const existing = await Booking.findOne({
    assignedPartnerId: partnerId,
    "slot.date": { $gte: start, $lte: end },
    "slot.time": bookingTime,
    bookingStatus: { $in: ["Pending", "Confirmed"] },
    assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
  }).select("_id");

  return !!existing;
};

// main function
const autoAssignPartner = async ({
  serviceId,
  serviceCategory,
  bookingDate,
  bookingTime,
  city,
  pincode,
  excludePartnerIds = [],
}) => {
  try {
    const partnerQuery = {
      role: "partner",
      isActive: true,
      "partner.isApproved": true,
      "partner.isAvailable": true,
    };

    if (Array.isArray(excludePartnerIds) && excludePartnerIds.length > 0) {
      partnerQuery._id = { $nin: excludePartnerIds };
    }

    const partners = await User.find(partnerQuery).select("_id email profile partner");

    if (!partners.length) {
      return {
        assigned: false,
        reason: "No active approved partners found",
        partner: null,
      };
    }

    // 1) service/category filter
    let matched = partners.filter((partner) => {
      const serviceIds = Array.isArray(partner?.partner?.serviceIds)
        ? partner.partner.serviceIds
        : [];

      const categories = Array.isArray(partner?.partner?.serviceCategories)
        ? partner.partner.serviceCategories
        : [];

      const serviceIdMatch = isServiceMatch(serviceId, serviceIds);
      const categoryMatch = isCategoryMatch(serviceCategory, categories);

      return serviceIdMatch || categoryMatch;
    });

    if (!matched.length) {
      return {
        assigned: false,
        reason: "No partners matched this service/category",
        partner: null,
      };
    }

    // 2) location filter with score
    matched = matched
      .map((partner) => ({
        partner,
        locationScore: getLocationMatchScore(partner, city, pincode),
      }))
      .filter((item) => item.locationScore > 0);

    if (!matched.length) {
      return {
        assigned: false,
        reason: "No partners available for this city/pincode",
        partner: null,
      };
    }

    // 3) working slot filter
    matched = matched.filter((item) =>
      isPartnerWorkingInSlot(item.partner, bookingDate, bookingTime)
    );

    if (!matched.length) {
      return {
        assigned: false,
        reason: "No partners available in selected slot",
        partner: null,
      };
    }

    // 4) enrich with load/rating/priority
    const enriched = [];

    for (const item of matched) {
      const partner = item.partner;

      const sameSlotBooked = await hasSameSlotBooking(
        partner._id,
        bookingDate,
        bookingTime
      );
      if (sameSlotBooked) continue;

      const todaysLoad = await getPartnerLoadForDate(partner._id, bookingDate);
      const maxBookingsPerDay = Number(partner?.partner?.maxBookingsPerDay || 5);
      const priority = Number(partner?.partner?.priority || 0);
      const averageRating = Number(partner?.partner?.averageRating || 0);
      const totalCompletedJobs = Number(
        partner?.partner?.totalCompletedJobs || 0
      );
      const allowDirectCustomerContact =
        partner?.partner?.allowDirectCustomerContact !== false;

      if (todaysLoad >= maxBookingsPerDay) continue;

      enriched.push({
        partner,
        locationScore: item.locationScore,
        todaysLoad,
        maxBookingsPerDay,
        priority,
        averageRating,
        totalCompletedJobs,
        allowDirectCustomerContact,
        serviceMatchScore: isServiceMatch(serviceId, partner?.partner?.serviceIds)
          ? 2
          : 1,
      });
    }

    if (!enriched.length) {
      return {
        assigned: false,
        reason: "All matching partners are fully booked or busy in this slot",
        partner: null,
      };
    }

    // 5) sort by:
    // exact service match desc
    // location match desc
    // priority desc
    // load asc
    // rating desc
    // completed jobs desc
    enriched.sort((a, b) => {
      if (b.serviceMatchScore !== a.serviceMatchScore) {
        return b.serviceMatchScore - a.serviceMatchScore;
      }

      if (b.locationScore !== a.locationScore) {
        return b.locationScore - a.locationScore;
      }

      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      if (a.todaysLoad !== b.todaysLoad) {
        return a.todaysLoad - b.todaysLoad;
      }

      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }

      return b.totalCompletedJobs - a.totalCompletedJobs;
    });

    const selectedData = enriched[0];
    const selected = selectedData.partner;

    return {
      assigned: true,
      reason: "Partner auto assigned successfully",
      partner: {
        _id: selected._id,
        name:
          selected?.profile?.name || selected?.email?.split("@")[0] || "Partner",
        email: selected?.email || "",
        phone: selected?.profile?.phone || "",
        city: selected?.profile?.city || "",
        image: selected?.profile?.image || "",
        allowDirectCustomerContact: selectedData.allowDirectCustomerContact,
      },
      meta: {
        serviceMatchScore: selectedData.serviceMatchScore,
        locationScore: selectedData.locationScore,
        todaysLoad: selectedData.todaysLoad,
        priority: selectedData.priority,
        averageRating: selectedData.averageRating,
        totalCompletedJobs: selectedData.totalCompletedJobs,
      },
    };
  } catch (error) {
    console.error("autoAssignPartner error:", error);
    return {
      assigned: false,
      reason: "Auto assignment failed",
      partner: null,
    };
  }
};

module.exports = autoAssignPartner;