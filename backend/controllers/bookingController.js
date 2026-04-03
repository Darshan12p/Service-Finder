const crypto = require("crypto");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
// const Review = require("../models/Review");
const User = require("../models/User");
const razorpay = require("../utils/razorpay");

// helper: safe number
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// helper: normalize selected options array
const normalizeSelectedOptions = (selectedOptions = []) => {
  if (!Array.isArray(selectedOptions)) return [];

  return selectedOptions.map((item) => ({
    groupId: item?.groupId || "",
    groupName: item?.groupName || "",
    optionId: item?.optionId || item?._id || "",
    optionLabel: item?.optionLabel || item?.label || item?.name || "",
    optionDescription: item?.optionDescription || item?.description || "",
    price: toNumber(item?.price, 0),
  }));
};

// helper: find package by id or name
const findServicePackage = (service, packageId, packageName) => {
  const packages = Array.isArray(service?.packages) ? service.packages : [];

  if (packageId) {
    const byId = packages.find(
      (p) => String(p?._id || "") === String(packageId)
    );
    if (byId) return byId;
  }

  if (packageName) {
    const byName = packages.find(
      (p) =>
        String(p?.name || "").trim().toLowerCase() ===
        String(packageName || "").trim().toLowerCase()
    );
    if (byName) return byName;
  }

  return null;
};

// helper: normalize text
const norm = (v = "") =>
  String(v || "")
    .trim()
    .toLowerCase();

// helper: partner snapshot
const buildPartnerSnapshot = (partner = {}) => ({
  partnerId: partner?._id || null,
  name:
    partner?.profile?.name ||
    partner?.name ||
    partner?.fullName ||
    partner?.email?.split("@")[0] ||
    "",
  email: partner?.email || "",
  phone: partner?.profile?.phone || partner?.phone || "",
  city:
    partner?.profile?.city ||
    partner?.city ||
    partner?.partner?.cities?.[0] ||
    "",
  image: partner?.profile?.image || partner?.image || "",
});

const recomputePartnerCompletedJobs = async (partnerId) => {
  try {
    if (!partnerId) return;

    const totalCompletedJobs = await Booking.countDocuments({
      assignedPartnerId: partnerId,
      bookingStatus: "Completed",
    });

    await User.findByIdAndUpdate(partnerId, {
      $set: {
        "partner.totalCompletedJobs": totalCompletedJobs,
      },
    });
  } catch (err) {
    console.error("recomputePartnerCompletedJobs error:", err);
  }
};

// helper: whether customer can contact assigned partner
const canEnablePartnerContact = (partner = {}) => {
  return (
    !!partner?._id && partner?.partner?.allowDirectCustomerContact !== false
  );
};

// helper: same day range
const getDayRange = (dateInput) => {
  const start = new Date(dateInput);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateInput);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// helper: service/category matching
const doesPartnerMatchService = (partner, service, bookingAddress = {}) => {
  const bookingServiceId = String(service?._id || "");
  const serviceCategory = norm(
    service?.category?.name || service?.category || service?.serviceCategory || ""
  );
  const bookingCity = norm(bookingAddress?.city || "");
  const bookingPincode = String(bookingAddress?.pincode || "").trim();

  const partnerServiceIds = Array.isArray(partner?.partner?.serviceIds)
    ? partner.partner.serviceIds.map((x) => String(x))
    : [];

  const partnerCategories = Array.isArray(partner?.partner?.serviceCategories)
    ? partner.partner.serviceCategories
    : [];

  const partnerCities = Array.isArray(partner?.partner?.cities)
    ? partner.partner.cities
    : [];

  const partnerPincodes = Array.isArray(partner?.partner?.pincodes)
    ? partner.partner.pincodes.map((x) => String(x))
    : [];

  const exactServiceMatch =
    !!bookingServiceId &&
    partnerServiceIds.length > 0 &&
    partnerServiceIds.includes(bookingServiceId);

  const categoryMatch =
    !!serviceCategory &&
    partnerCategories.some((c) => {
      const n = norm(c);
      return (
        n === serviceCategory ||
        n.includes(serviceCategory) ||
        serviceCategory.includes(n)
      );
    });

  const cityMatch =
    !bookingCity ||
    partnerCities.length === 0 ||
    partnerCities.some((c) => {
      const n = norm(c);
      return (
        n === bookingCity ||
        n.includes(bookingCity) ||
        bookingCity.includes(n)
      );
    });

  const pincodeMatch =
    !bookingPincode ||
    partnerPincodes.length === 0 ||
    partnerPincodes.includes(bookingPincode);

  return {
    exactServiceMatch,
    categoryMatch,
    cityMatch,
    pincodeMatch,
    matches: (exactServiceMatch || categoryMatch) && cityMatch && pincodeMatch,
  };
};

const getDayName = (dateInput) => {
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

const timeToMinutes = (time = "") => {
  const [h, m] = String(time || "")
    .split(":")
    .map(Number);
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

const isPartnerWorkingAtSlot = (partner, slotDate, slotTime) => {
  if (!slotDate || !slotTime) return true;

  const dayName = getDayName(slotDate);
  const target = timeToMinutes(slotTime);

  const workingSlots = Array.isArray(partner?.partner?.workingSlots)
    ? partner.partner.workingSlots
    : [];

  const daySlot = workingSlots.find(
    (s) => s?.day === dayName && s?.isAvailable !== false
  );

  if (!daySlot) return false;

  const start = timeToMinutes(daySlot?.startTime || "00:00");
  const end = timeToMinutes(daySlot?.endTime || "23:59");

  return target >= start && target < end;
};

// helper: check partner slot availability
const validatePartnerAvailabilityForSlot = async ({
  partnerId,
  slotDate,
  slotTime,
  excludeBookingId = null,
}) => {
  const { start, end } = getDayRange(slotDate);

  const dailyLoadQuery = {
    assignedPartnerId: partnerId,
    "slot.date": { $gte: start, $lte: end },
    bookingStatus: { $in: ["Pending", "Confirmed"] },
    assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
  };

  if (excludeBookingId) {
    dailyLoadQuery._id = { $ne: excludeBookingId };
  }

  let sameSlotBooking = null;

  if (slotTime && slotTime !== "__skip_same_slot_check__") {
    const sameSlotQuery = {
      assignedPartnerId: partnerId,
      "slot.date": { $gte: start, $lte: end },
      "slot.time": slotTime,
      bookingStatus: { $in: ["Pending", "Confirmed"] },
      assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
    };

    if (excludeBookingId) {
      sameSlotQuery._id = { $ne: excludeBookingId };
    }

    sameSlotBooking = await Booking.findOne(sameSlotQuery).select("_id");
  }

  const todaysLoad = await Booking.countDocuments(dailyLoadQuery);

  return {
    sameSlotBooking,
    todaysLoad,
  };
};

// ================= CREATE BOOKING =================
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      phone,

      serviceId,
      partnerId,

      packageId,
      packageName,
      packagePrice,
      basePrice,
      finalPrice,
      durationMins,

      selectedOptions,
      selectedOptionsMap,

      address,
      slot,
      paymentMethod,
      notes,
    } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: "serviceId required" });
    }

    if (!packageName?.trim()) {
      return res.status(400).json({ message: "packageName required" });
    }

    if (!address?.line1?.trim()) {
      return res.status(400).json({ message: "address.line1 required" });
    }

    if (!slot?.date || !slot?.time) {
      return res
        .status(400)
        .json({ message: "slot.date and slot.time required" });
    }

    const allowedPayment = ["Cash", "Card", "UPI", "Razorpay"];
    if (!allowedPayment.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid paymentMethod (Cash/Card/UPI/Razorpay)",
      });
    }

    const svc = await Service.findById(serviceId);
    if (!svc) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (!partnerId) {
      return res.status(400).json({ message: "partnerId required" });
    }

    const selectedPartner = await User.findById(partnerId);
    if (!selectedPartner || selectedPartner.role !== "partner") {
      return res.status(404).json({ message: "Selected partner not found" });
    }

    if (
      !selectedPartner.isActive ||
      selectedPartner?.partner?.isApproved !== true
    ) {
      return res
        .status(400)
        .json({ message: "Selected partner is not active/approved" });
    }

    if (selectedPartner?.partner?.isAvailable === false) {
      return res
        .status(400)
        .json({ message: "Selected partner is currently unavailable" });
    }

    const partnerMatchInfo = doesPartnerMatchService(
      selectedPartner,
      svc,
      address
    );

    if (!partnerMatchInfo.matches) {
      return res.status(400).json({
        message: "Selected partner does not match this service or location",
      });
    }

    const workingSlotMatch = isPartnerWorkingAtSlot(
      selectedPartner,
      slot.date,
      slot.time
    );

    if (!workingSlotMatch) {
      return res.status(400).json({
        message: "Selected partner is not working at the selected time",
      });
    }

    const { sameSlotBooking, todaysLoad } =
      await validatePartnerAvailabilityForSlot({
        partnerId: selectedPartner._id,
        slotDate: new Date(slot.date),
        slotTime: slot.time,
      });

    if (sameSlotBooking) {
      return res.status(400).json({
        message: "Selected partner is already booked for this time slot",
      });
    }

    const maxBookingsPerDay = Number(
      selectedPartner?.partner?.maxBookingsPerDay || 5
    );

    if (todaysLoad >= maxBookingsPerDay) {
      return res.status(400).json({
        message: "Selected partner has reached maximum bookings for the day",
      });
    }

    const selectedPartnerSnapshot = buildPartnerSnapshot(selectedPartner);
    const allowPartnerContact = canEnablePartnerContact(selectedPartner);

    let resolvedCustomerName = customerName?.trim() || "";
    let resolvedCustomerEmail = customerEmail?.trim() || "";
    let resolvedPhone = phone?.trim?.() || "";

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      resolvedCustomerName =
        resolvedCustomerName ||
        user?.profile?.name ||
        user?.name ||
        user?.fullName ||
        "Customer";

      resolvedCustomerEmail =
        resolvedCustomerEmail || user?.email || "unknown@mail.com";

      resolvedPhone =
        resolvedPhone || user?.profile?.phone || user?.phone || "";
    }

    if (!resolvedCustomerName) {
      return res.status(400).json({ message: "customerName required" });
    }

    if (!resolvedCustomerEmail) {
      return res.status(400).json({ message: "customerEmail required" });
    }

    const svcPkg = findServicePackage(svc, packageId, packageName);
    if (!svcPkg) {
      return res.status(404).json({ message: "Package not found in service" });
    }

    if (svcPkg?.isActive === false) {
      return res.status(400).json({ message: "Selected package is inactive" });
    }

    const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions);

    const resolvedBasePrice = toNumber(
      basePrice,
      toNumber(
        packagePrice,
        toNumber(svcPkg?.basePrice, toNumber(svcPkg?.price, 0))
      )
    );

    const selectedExtrasTotal = normalizedSelectedOptions.reduce(
      (sum, item) => sum + toNumber(item?.price, 0),
      0
    );

    const resolvedFinalPrice = toNumber(
      finalPrice,
      resolvedBasePrice + selectedExtrasTotal
    );

    const resolvedDurationMins = toNumber(
      durationMins,
      toNumber(svcPkg?.durationMins, 0)
    );

    const booking = await Booking.create({
      userId: userId || null,

      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      phone: resolvedPhone,

      serviceId,
      serviceTitle: svc.title || svc.name || "Service",
      serviceCategory:
        svc.category?.name || svc.category || svc.serviceCategory || "General",

      packageId: packageId || String(svcPkg?._id || ""),
      packageName: packageName.trim(),
      packagePrice: toNumber(packagePrice, resolvedBasePrice),

      basePrice: resolvedBasePrice,
      finalPrice: resolvedFinalPrice,
      durationMins: resolvedDurationMins,

      selectedOptions: normalizedSelectedOptions,
      selectedOptionsMap:
        selectedOptionsMap && typeof selectedOptionsMap === "object"
          ? selectedOptionsMap
          : {},

      address: {
        label: address.label || "Home",
        line1: address.line1,
        houseNo: address.houseNo || "",
        landmark: address.landmark || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        lat: address.lat ?? null,
        lng: address.lng ?? null,
        source: address.source || "",
      },

      slot: {
        date: new Date(slot.date),
        time: slot.time,
      },

      paymentMethod,
      paymentStatus: "Unpaid",
      paymentGateway: paymentMethod === "Razorpay" ? "Razorpay" : "",
      paymentAttemptedAt: paymentMethod === "Razorpay" ? new Date() : null,

      amount: resolvedFinalPrice,
      bookingStatus: "Pending",

      assignedPartnerId: selectedPartner._id,
      assignedPartnerName: selectedPartnerSnapshot.name,
      assignedPartnerEmail: selectedPartnerSnapshot.email,
      assignedPartnerPhone: selectedPartnerSnapshot.phone,
      assignedPartnerCity: selectedPartnerSnapshot.city,
      assignedPartnerImage: selectedPartnerSnapshot.image,
      assignedPartnerSnapshot: selectedPartnerSnapshot,

      assignmentStatus: "Assigned",
      assignmentMethod: "UserSelected",
      assignedAt: new Date(),
      assignedBy: userId || null,

      partnerResponseStatus: "Pending",
      partnerResponseAt: null,

      contactPartnerEnabled: allowPartnerContact,

      notes: notes || "",
    });

    await Service.findByIdAndUpdate(booking.serviceId, {
      $inc: { usageCount: 1 },
    });

    const finalBooking = await Booking.findById(booking._id).populate(
      "serviceId",
      "title image imageUrl category"
    );

    return res.status(201).json({
      message: "Booking created successfully",
      booking: finalBooking,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  }
};

// ================= CREATE RAZORPAY ORDER =================
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);
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
      return res
        .status(400)
        .json({ message: "Cannot create payment order for cancelled booking" });
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
        serviceTitle: booking.serviceTitle || "",
      },
    });

    booking.razorpayOrderId = order.id;
    booking.paymentMethod = "Razorpay";
    booking.paymentGateway = "Razorpay";
    booking.paymentAttemptedAt = new Date();
    await booking.save();

    return res.json({
      message: "Razorpay order created successfully",
      key: process.env.RAZORPAY_KEY_ID,
      order,
      booking: {
        _id: booking._id,
        amount: booking.amount,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        phone: booking.phone || "",
        serviceTitle: booking.serviceTitle,
      },
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    return res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

// ================= VERIFY RAZORPAY PAYMENT =================
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
      return res
        .status(400)
        .json({ message: "All Razorpay payment fields are required" });
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

    if (!booking.razorpayOrderId) {
      return res
        .status(400)
        .json({ message: "No Razorpay order found for this booking" });
    }

    if (booking.paymentStatus === "Paid") {
      return res.json({
        message: "Payment already verified",
        booking,
      });
    }

    if (String(booking.razorpayOrderId) !== String(razorpay_order_id)) {
      return res.status(400).json({ message: "Invalid Razorpay order id" });
    }

    const body = `${booking.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      booking.paymentStatus = "Failed";
      await booking.save();

      return res.status(400).json({ message: "Payment verification failed" });
    }

    booking.paymentMethod = "Razorpay";
    booking.paymentGateway = "Razorpay";
    booking.paymentStatus = "Paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();

    if (booking.bookingStatus === "Pending") {
      booking.bookingStatus = "Confirmed";
    }

    await booking.save();

    return res.json({
      message: "Payment verified successfully",
      booking,
    });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};

// ================= MARK RAZORPAY PAYMENT FAILED =================
exports.markPaymentFailed = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (userId && String(booking.userId || "") !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.paymentStatus !== "Paid") {
      booking.paymentStatus = "Failed";
      booking.paymentMethod = "Razorpay";
      booking.paymentGateway = "Razorpay";
      booking.paymentAttemptedAt = new Date();
      await booking.save();
    }

    return res.json({ message: "Payment marked as failed" });
  } catch (err) {
    console.error("markPaymentFailed error:", err);
    return res.status(500).json({ message: "Failed to update payment status" });
  }
};

// ================= USER GET SINGLE BOOKING DETAILS =================
exports.getUserBookingDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "title image imageUrl category"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.userId || "") !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.assignedPartnerId && !booking.partnerDetailsViewedAt) {
      booking.partnerDetailsViewedAt = new Date();
      await booking.save();
    }

    return res.json({
      booking,
      assistedPartner: booking?.assignedPartnerId
        ? {
            _id: booking.assignedPartnerId,
            name:
              booking.assignedPartnerSnapshot?.name ||
              booking.assignedPartnerName ||
              "",
            email:
              booking.assignedPartnerSnapshot?.email ||
              booking.assignedPartnerEmail ||
              "",
            phone:
              booking.assignedPartnerSnapshot?.phone ||
              booking.assignedPartnerPhone ||
              "",
            city:
              booking.assignedPartnerSnapshot?.city ||
              booking.assignedPartnerCity ||
              "",
            image:
              booking.assignedPartnerSnapshot?.image ||
              booking.assignedPartnerImage ||
              "",
            contactEnabled: !!booking.contactPartnerEnabled,
            assignmentStatus: booking.assignmentStatus,
            partnerResponseStatus: booking.partnerResponseStatus,
          }
        : null,
    });
  } catch (err) {
    console.error("getUserBookingDetails error:", err);
    return res.status(500).json({ message: "Failed to fetch booking details" });
  }
};


// ================= ADMIN GET BOOKINGS =================
exports.getBookings = async (req, res) => {
  try {
    const { status = "All", search = "", page = 1, limit = 100 } = req.query;

    const query = {};

    if (status && status !== "All") {
      query.bookingStatus = status;
    }

    if (String(search || "").trim()) {
      const s = String(search).trim();
      query.$or = [
        { customerName: { $regex: s, $options: "i" } },
        { customerEmail: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { serviceTitle: { $regex: s, $options: "i" } },
        { serviceCategory: { $regex: s, $options: "i" } },
        { packageName: { $regex: s, $options: "i" } },
        { "address.line1": { $regex: s, $options: "i" } },
        { "address.city": { $regex: s, $options: "i" } },
        { "address.pincode": { $regex: s, $options: "i" } },
        { assignedPartnerName: { $regex: s, $options: "i" } },
        { assignedPartnerEmail: { $regex: s, $options: "i" } },
        { assignedPartnerPhone: { $regex: s, $options: "i" } },
        { paymentStatus: { $regex: s, $options: "i" } },
        { paymentMethod: { $regex: s, $options: "i" } },
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 100, 1);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("serviceId", "title image imageUrl category"),
      Booking.countDocuments(query),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("getBookings error:", err);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ================= ADMIN UPDATE BOOKING STATUS =================
// ================= ADMIN UPDATE BOOKING STATUS =================
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingStatus } = req.body;

    const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
    if (!allowed.includes(bookingStatus)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "title image imageUrl category"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const previousStatus = booking.bookingStatus;
    const partnerId = booking.assignedPartnerId || null;

    booking.bookingStatus = bookingStatus;
    await booking.save();

    // recompute partner completed jobs if status changed in/out of Completed
    if (
      partnerId &&
      (previousStatus === "Completed" || bookingStatus === "Completed")
    ) {
      await recomputePartnerCompletedJobs(partnerId);
    }

    return res.json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (err) {
    console.error("updateBookingStatus error:", err);
    return res.status(500).json({ message: "Failed to update booking status" });
  }
};

// ================= ADMIN DELETE BOOKING =================
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const partnerId = booking.assignedPartnerId || null;
    const wasCompleted = booking.bookingStatus === "Completed";

    await Booking.findByIdAndDelete(bookingId);

    if (partnerId && wasCompleted) {
      await recomputePartnerCompletedJobs(partnerId);
    }

    return res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("deleteBooking error:", err);
    return res.status(500).json({ message: "Failed to delete booking" });
  }
};

// ================= ADMIN GET ASSIGNABLE PARTNERS =================
exports.getAssignablePartners = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingCity = norm(booking?.address?.city);
    const bookingPincode = String(booking?.address?.pincode || "").trim();
    const bookingServiceId = String(booking.serviceId || "");
    const serviceCategory = norm(booking.serviceCategory || "");
    const { start, end } = getDayRange(booking?.slot?.date);

    const partners = await User.find({
      role: "partner",
      isActive: true,
      "partner.isApproved": true,
    }).select("_id email profile partner");

    const items = [];

    for (const partner of partners) {
      const serviceIds = Array.isArray(partner?.partner?.serviceIds)
        ? partner.partner.serviceIds.map((x) => String(x))
        : [];

      const serviceCategories = Array.isArray(partner?.partner?.serviceCategories)
        ? partner.partner.serviceCategories
        : [];

      const cities = Array.isArray(partner?.partner?.cities)
        ? partner.partner.cities
        : [];

      const pincodes = Array.isArray(partner?.partner?.pincodes)
        ? partner.partner.pincodes.map((x) => String(x))
        : [];

      const exactServiceMatch = bookingServiceId
        ? serviceIds.includes(bookingServiceId)
        : false;

      const categoryMatch =
        !serviceCategory ||
        serviceCategories.length === 0 ||
        serviceCategories.some((c) => {
          const n = norm(c);
          return (
            n === serviceCategory ||
            serviceCategory.includes(n) ||
            n.includes(serviceCategory)
          );
        });

      if (!exactServiceMatch && !categoryMatch) {
        continue;
      }

      const cityMatch =
        !bookingCity ||
        cities.length === 0 ||
        cities.some((c) => {
          const n = norm(c);
          return (
            n === bookingCity ||
            bookingCity.includes(n) ||
            n.includes(bookingCity)
          );
        });

      const pincodeMatch =
        !bookingPincode ||
        pincodes.length === 0 ||
        pincodes.includes(bookingPincode);

      const todaysLoad = await Booking.countDocuments({
        assignedPartnerId: partner._id,
        "slot.date": { $gte: start, $lte: end },
        bookingStatus: { $in: ["Pending", "Confirmed"] },
        assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
      });

      const sameSlotBooking = await Booking.findOne({
        assignedPartnerId: partner._id,
        "slot.date": { $gte: start, $lte: end },
        "slot.time": booking?.slot?.time,
        bookingStatus: { $in: ["Pending", "Confirmed"] },
        assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
      }).select("_id");

      const maxBookingsPerDay = Number(
        partner?.partner?.maxBookingsPerDay || 5
      );
      const priority = Number(partner?.partner?.priority || 0);

      const isAvailable =
        partner?.partner?.isAvailable !== false &&
        todaysLoad < maxBookingsPerDay &&
        !sameSlotBooking;

      items.push({
        _id: partner._id,
        name:
          partner?.profile?.name ||
          partner?.name ||
          partner?.fullName ||
          partner?.email?.split("@")[0] ||
          "Partner",
        email: partner?.email || "",
        phone: partner?.profile?.phone || partner?.phone || "",
        city: partner?.profile?.city || partner?.city || "",
        image: partner?.profile?.image || partner?.image || "",

        priority,
        maxBookingsPerDay,
        isAvailable,

        serviceCategories,
        cities,
        pincodes,

        exactServiceMatch,
        categoryMatch,
        cityMatch,
        pincodeMatch,
        todaysLoad,
      });
    }

    items.sort((a, b) => {
      if (Number(b.isAvailable) !== Number(a.isAvailable)) {
        return Number(b.isAvailable) - Number(a.isAvailable);
      }
      if (Number(b.exactServiceMatch) !== Number(a.exactServiceMatch)) {
        return Number(b.exactServiceMatch) - Number(a.exactServiceMatch);
      }
      if (Number(b.pincodeMatch) !== Number(a.pincodeMatch)) {
        return Number(b.pincodeMatch) - Number(a.pincodeMatch);
      }
      if (Number(b.cityMatch) !== Number(a.cityMatch)) {
        return Number(b.cityMatch) - Number(a.cityMatch);
      }
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.todaysLoad - b.todaysLoad;
    });

    return res.json({ items });
  } catch (err) {
    console.error("getAssignablePartners error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch assignable partners" });
  }
};

// ================= ADMIN MANUAL ASSIGN PARTNER =================
exports.assignPartnerManually = async (req, res) => {
  try {
    const { bookingId, partnerId } = req.params;

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "title image imageUrl category"
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== "partner") {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (!partner.isActive || partner?.partner?.isApproved !== true) {
      return res
        .status(400)
        .json({ message: "Partner is not active/approved" });
    }

    const { start, end } = getDayRange(booking?.slot?.date);

    const sameSlotBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      assignedPartnerId: partner._id,
      "slot.date": { $gte: start, $lte: end },
      "slot.time": booking?.slot?.time,
      bookingStatus: { $in: ["Pending", "Confirmed"] },
      assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
    }).select("_id");

    if (sameSlotBooking) {
      return res.status(400).json({
        message: "This partner already has another booking in the same slot",
      });
    }

    const todaysLoad = await Booking.countDocuments({
      _id: { $ne: booking._id },
      assignedPartnerId: partner._id,
      "slot.date": { $gte: start, $lte: end },
      bookingStatus: { $in: ["Pending", "Confirmed"] },
      assignmentStatus: { $in: ["Assigned", "Accepted", "Reassigned"] },
    });

    const maxBookingsPerDay = Number(partner?.partner?.maxBookingsPerDay || 5);

    if (todaysLoad >= maxBookingsPerDay) {
      return res.status(400).json({
        message: "This partner has reached maximum bookings for the day",
      });
    }

    const previousPartnerId = booking.assignedPartnerId
      ? String(booking.assignedPartnerId)
      : "";

    const isReassigned =
      !!previousPartnerId && previousPartnerId !== String(partner._id);

    const snapshot = buildPartnerSnapshot(partner);
    const allowContact = canEnablePartnerContact(partner);

    booking.assignedPartnerId = partner._id;
    booking.assignedPartnerName = snapshot.name;
    booking.assignedPartnerEmail = snapshot.email;
    booking.assignedPartnerPhone = snapshot.phone;
    booking.assignedPartnerCity = snapshot.city;
    booking.assignedPartnerImage = snapshot.image;
    booking.assignedPartnerSnapshot = snapshot;

    booking.assignmentStatus = isReassigned ? "Reassigned" : "Assigned";
    booking.assignmentMethod = "Manual";
    booking.assignedAt = new Date();
    booking.assignedBy = req.user?.id || null;

    booking.partnerResponseStatus = "Pending";
    booking.partnerResponseAt = null;

    booking.contactPartnerEnabled = allowContact;

    if (isReassigned) {
      booking.reassignedCount = Number(booking.reassignedCount || 0) + 1;
    }

    await booking.save();

    return res.json({
      message: isReassigned
        ? "Partner reassigned successfully"
        : "Partner assigned successfully",
      booking,
    });
  } catch (err) {
    console.error("assignPartnerManually error:", err);
    return res.status(500).json({ message: "Failed to assign partner" });
  }
};

// ================= GET PARTNER ASSIGNED BOOKINGS =================
exports.getPartnerBookings = async (req, res) => {
  try {
    const partnerId = req.user?.id;

    if (!partnerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(partnerId);
    if (!user || user.role !== "partner") {
      return res.status(403).json({ message: "Only partner can access this" });
    }

    const { tab = "all" } = req.query;

    const query = {
      assignedPartnerId: partnerId,
    };

    if (tab === "pending") {
      query.partnerResponseStatus = "Pending";
      query.assignmentStatus = { $in: ["Assigned", "Reassigned"] };
      query.bookingStatus = { $in: ["Pending", "Confirmed"] };
    } else if (tab === "accepted") {
      query.partnerResponseStatus = "Accepted";
      query.assignmentStatus = "Accepted";
      query.bookingStatus = { $in: ["Pending", "Confirmed"] };
    } else if (tab === "completed") {
      query.bookingStatus = "Completed";
    } else if (tab === "cancelled") {
      query.bookingStatus = "Cancelled";
    }

    const items = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("serviceId", "title image imageUrl category");

    return res.json({ items });
  } catch (err) {
    console.error("getPartnerBookings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch partner bookings" });
  }
};

// ================= PARTNER ACCEPT BOOKING =================
exports.partnerAcceptBooking = async (req, res) => {
  try {
    const partnerId = req.user?.id;
    const { bookingId } = req.params;

    if (!partnerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(partnerId);
    if (!user || user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partner can accept booking" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.assignedPartnerId || "") !== String(partnerId)) {
      return res
        .status(403)
        .json({ message: "This booking is not assigned to you" });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Cancelled booking cannot be accepted" });
    }

    if (booking.bookingStatus === "Completed") {
      return res
        .status(400)
        .json({ message: "Completed booking cannot be accepted" });
    }

    booking.assignmentStatus = "Accepted";
    booking.partnerResponseStatus = "Accepted";
    booking.partnerResponseAt = new Date();
    booking.contactPartnerEnabled = !!booking.assignedPartnerId;

    if (booking.bookingStatus === "Pending") {
      booking.bookingStatus = "Confirmed";
    }

    await booking.save();

    return res.json({
      message: "Booking accepted successfully",
      booking,
    });
  } catch (err) {
    console.error("partnerAcceptBooking error:", err);
    return res.status(500).json({ message: "Failed to accept booking" });
  }
};

// ================= PARTNER REJECT BOOKING =================
exports.partnerRejectBooking = async (req, res) => {
  try {
    const partnerId = req.user?.id;
    const { bookingId } = req.params;

    if (!partnerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(partnerId);
    if (!user || user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partner can reject booking" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.assignedPartnerId || "") !== String(partnerId)) {
      return res
        .status(403)
        .json({ message: "This booking is not assigned to you" });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Cancelled booking cannot be rejected" });
    }

    if (booking.bookingStatus === "Completed") {
      return res
        .status(400)
        .json({ message: "Completed booking cannot be rejected" });
    }

    booking.assignmentStatus = "Unassigned";
    booking.assignmentMethod = "Manual";
    booking.partnerResponseStatus = "Rejected";
    booking.partnerResponseAt = new Date();
    booking.contactPartnerEnabled = false;

    booking.assignedPartnerId = null;
    booking.assignedPartnerName = "";
    booking.assignedPartnerEmail = "";
    booking.assignedPartnerPhone = "";
    booking.assignedPartnerCity = "";
    booking.assignedPartnerImage = "";
    booking.assignedPartnerSnapshot = {};
    booking.assignedAt = null;

    await booking.save();

    return res.json({
      message:
        "Booking rejected successfully. Admin can assign another partner.",
      booking,
    });
  } catch (err) {
    console.error("partnerRejectBooking error:", err);
    return res.status(500).json({ message: "Failed to reject booking" });
  }
};

// ================= USER GET MATCHING PARTNERS BY SERVICE =================
exports.getPartnersForServiceBooking = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const city = String(req.query.city || "").trim();
    const pincode = String(req.query.pincode || "").trim();
    const date = String(req.query.date || "").trim();
    const time = String(req.query.time || "").trim();

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const partners = await User.find({
      role: "partner",
      isActive: true,
      "partner.isApproved": true,
      "partner.isAvailable": true,
    }).select("_id email profile partner");

    const items = [];

    for (const partner of partners) {
      const matchInfo = doesPartnerMatchService(partner, service, {
        city,
        pincode,
      });

      if (!matchInfo.matches) continue;

      let workingSlotMatch = true;
      if (date && time) {
        workingSlotMatch = isPartnerWorkingAtSlot(partner, date, time);
        if (!workingSlotMatch) continue;
      }

      let sameSlotBooking = null;
      let todaysLoad = 0;

      if (date && time) {
        const result = await validatePartnerAvailabilityForSlot({
          partnerId: partner._id,
          slotDate: new Date(date),
          slotTime: time,
        });

        sameSlotBooking = result.sameSlotBooking;
        todaysLoad = result.todaysLoad;
      } else if (date) {
        const result = await validatePartnerAvailabilityForSlot({
          partnerId: partner._id,
          slotDate: new Date(date),
          slotTime: "__skip_same_slot_check__",
        });

        todaysLoad = result.todaysLoad;
      }

      const maxBookingsPerDay = Number(
        partner?.partner?.maxBookingsPerDay || 5
      );
      const priority = Number(partner?.partner?.priority || 0);

      const isAvailableForSlot = date && time ? !sameSlotBooking : true;
      const isAvailableForDay = todaysLoad < maxBookingsPerDay;

      const isAvailable =
        partner?.partner?.isAvailable !== false &&
        workingSlotMatch &&
        isAvailableForSlot &&
        isAvailableForDay;

      items.push({
        _id: partner._id,
        name:
          partner?.profile?.name || partner?.email?.split("@")[0] || "Partner",
        email: partner?.email || "",
        phone: partner?.profile?.phone || "",
        city: partner?.profile?.city || partner?.partner?.cities?.[0] || "",
        image: partner?.profile?.image || "",
        experienceYears: Number(partner?.partner?.experienceYears || 0),
        averageRating: Number(partner?.partner?.averageRating || 0),
        totalCompletedJobs: Number(partner?.partner?.totalCompletedJobs || 0),

        priority,
        maxBookingsPerDay,
        todaysLoad,

        exactServiceMatch: matchInfo.exactServiceMatch,
        categoryMatch: matchInfo.categoryMatch,
        cityMatch: matchInfo.cityMatch,
        pincodeMatch: matchInfo.pincodeMatch,
        workingSlotMatch,

        isAvailable,
      });
    }

    items.sort((a, b) => {
      if (Number(b.isAvailable) !== Number(a.isAvailable)) {
        return Number(b.isAvailable) - Number(a.isAvailable);
      }
      if (Number(b.exactServiceMatch) !== Number(a.exactServiceMatch)) {
        return Number(b.exactServiceMatch) - Number(a.exactServiceMatch);
      }
      if (Number(b.categoryMatch) !== Number(a.categoryMatch)) {
        return Number(b.categoryMatch) - Number(a.categoryMatch);
      }
      if (Number(b.pincodeMatch) !== Number(a.pincodeMatch)) {
        return Number(b.pincodeMatch) - Number(a.pincodeMatch);
      }
      if (Number(b.cityMatch) !== Number(a.cityMatch)) {
        return Number(b.cityMatch) - Number(a.cityMatch);
      }
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.todaysLoad - b.todaysLoad;
    });

    return res.json({
      message: "Matching partners fetched successfully",
      items,
    });
  } catch (err) {
    console.error("getPartnersForServiceBooking error:", err);
    return res.status(500).json({ message: "Failed to fetch partners" });
  }
};