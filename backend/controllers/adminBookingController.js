const Booking = require("../models/Booking");
const User = require("../models/User");

// GET /api/admin/bookings?status=&search=&page=&limit=
exports.getBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status && status !== "All") query.bookingStatus = status;

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { customerName: { $regex: s, $options: "i" } },
        { customerEmail: { $regex: s, $options: "i" } },
        { serviceTitle: { $regex: s, $options: "i" } },
        { serviceCategory: { $regex: s, $options: "i" } },
        { assignedPartnerName: { $regex: s, $options: "i" } },
        { assignedPartnerEmail: { $regex: s, $options: "i" } },
        { "address.line1": { $regex: s, $options: "i" } },
        { "address.city": { $regex: s, $options: "i" } },
        { "address.pincode": { $regex: s, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// POST /api/admin/bookings
exports.createBooking = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      phone,
      city,
      serviceCategory,
      amount,
      bookingStatus,
    } = req.body;

    if (!customerName || !customerEmail || !serviceCategory) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = await Booking.create({
      customerName,
      customerEmail,
      phone: phone || "",
      city: city || "Ahmedabad",
      serviceCategory,
      amount: Number(amount) || 0,
      bookingStatus: bookingStatus || "Pending",
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// PATCH /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus } = req.body;

    const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
    if (!allowed.includes(bookingStatus)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { bookingStatus },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Status updated", booking: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update booking status" });
  }
};

// DELETE /api/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete booking" });
  }
};

// GET /api/admin/bookings/:id/partners
exports.getAssignablePartners = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const serviceCategory = String(booking.serviceCategory || "")
      .trim()
      .toLowerCase();

    const city = String(booking?.address?.city || "")
      .trim()
      .toLowerCase();

    const pincode = String(booking?.address?.pincode || "").trim();

    const partners = await User.find({
      role: "partner",
      isActive: true,
      "partner.isApproved": true,
    }).select("_id email profile partner");

    const matched = partners.filter((u) => {
      const categories = Array.isArray(u?.partner?.serviceCategories)
        ? u.partner.serviceCategories.map((x) =>
            String(x || "").trim().toLowerCase()
          )
        : [];

      const cities = Array.isArray(u?.partner?.cities)
        ? u.partner.cities.map((x) =>
            String(x || "").trim().toLowerCase()
          )
        : [];

      const pincodes = Array.isArray(u?.partner?.pincodes)
        ? u.partner.pincodes.map((x) => String(x || "").trim())
        : [];

      // ✅ flexible category match
      const categoryMatch =
        !categories.length ||
        categories.some((cat) => {
          if (!cat || !serviceCategory) return false;

          return (
            cat === serviceCategory ||
            serviceCategory.includes(cat) ||
            cat.includes(serviceCategory)
          );
        });

      const cityMatch = !city || !cities.length || cities.includes(city);

      const pincodeMatch =
        !pincode || !pincodes.length || pincodes.includes(pincode);

      const availableMatch = u?.partner?.isAvailable !== false;

      return categoryMatch && availableMatch && (cityMatch || pincodeMatch);
    });

    return res.json({
      items: matched.map((u) => ({
        _id: u._id,
        email: u.email,
        name:
          u?.profile?.name ||
          u?.name ||
          u?.email?.split("@")[0] ||
          "Partner",
        phone: u?.profile?.phone || u?.phone || "",
        city: u?.profile?.city || u?.city || "",
        isAvailable: u?.partner?.isAvailable !== false,
        serviceCategories: u?.partner?.serviceCategories || [],
        cities: u?.partner?.cities || [],
        pincodes: u?.partner?.pincodes || [],
        priority: u?.partner?.priority || 0,
        maxBookingsPerDay: u?.partner?.maxBookingsPerDay || 5,
      })),
    });
  } catch (err) {
    console.error("getAssignablePartners error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch assignable partners" });
  }
};
// PATCH /api/admin/bookings/:id/assign-partner
exports.assignPartnerManually = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({ message: "partnerId is required" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "partner") {
      return res
        .status(400)
        .json({ message: "Selected user is not a partner" });
    }

    if (!partner.isActive) {
      return res.status(400).json({ message: "Partner is blocked/inactive" });
    }

    if (!partner?.partner?.isApproved) {
      return res.status(400).json({ message: "Partner is not approved" });
    }

    const wasAlreadyAssigned = !!booking.assignedPartnerId;

    booking.assignedPartnerId = partner._id;
    booking.assignedPartnerName =
      partner?.profile?.name ||
      partner?.name ||
      partner?.email?.split("@")[0] ||
      "Partner";
    booking.assignedPartnerEmail = partner?.email || "";
    booking.assignedPartnerPhone =
      partner?.profile?.phone || partner?.phone || "";

    booking.assignmentStatus = wasAlreadyAssigned ? "Reassigned" : "Assigned";
    booking.assignmentMethod = "Manual";
    booking.assignedAt = new Date();
    booking.partnerResponseStatus = "Pending";
    booking.partnerResponseAt = null;
    booking.reassignedCount = wasAlreadyAssigned
      ? Number(booking.reassignedCount || 0) + 1
      : Number(booking.reassignedCount || 0);

    await booking.save();

    return res.json({
      message: "Partner assigned successfully",
      booking,
    });
  } catch (err) {
    console.error("assignPartnerManually error:", err);
    return res.status(500).json({ message: "Failed to assign partner" });
  }
};