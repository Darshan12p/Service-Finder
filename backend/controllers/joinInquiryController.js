const JoinInquiry = require("../models/JoinInquiry");
const User = require("../models/User");
const Service = require("../models/Service");

// helpers
const cleanString = (v = "") => String(v || "").trim();

const parseCsvArray = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const normalizeWorkingSlots = (workingSlots = []) => {
  if (!Array.isArray(workingSlots)) return [];

  return workingSlots
    .filter((slot) => slot && slot.day)
    .map((slot) => ({
      day: cleanString(slot.day),
      startTime: cleanString(slot.startTime || "09:00"),
      endTime: cleanString(slot.endTime || "18:00"),
      isAvailable:
        typeof slot.isAvailable === "boolean" ? slot.isAvailable : true,
    }));
};

const extractServiceCategoryNames = (services = [], fallback = []) => {
  const fromServices = services
    .map((s) => s?.category?.name || s?.category || s?.title || "")
    .map(cleanString)
    .filter(Boolean);

  const fromFallback = Array.isArray(fallback)
    ? fallback.map(cleanString).filter(Boolean)
    : [];

  return [...new Set([...fromServices, ...fromFallback])];
};

// USER: create inquiry
exports.createJoinInquiry = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      gender,
      email,
      dob,
      city,
      addressLine1,
      pincode,
      degree,
      institute,
      passingYear,
      experienceYears,
      currentRole,
      about,
      skills,
      serviceIds,
      workingSlots,
    } = req.body;

    if (
      !cleanString(fullName) ||
      !cleanString(phone) ||
      !gender ||
      !cleanString(email) ||
      !cleanString(dob) ||
      !cleanString(city)
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // stop duplicate pending requests
    const existingPending = await JoinInquiry.findOne({
      userId: user._id,
      status: "pending",
    });

    if (existingPending) {
      return res.status(409).json({
        message: "You already have a pending partner inquiry",
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills.map(cleanString).filter(Boolean)
      : parseCsvArray(skills);

    // parse serviceIds
    let parsedServiceIds = [];
    if (Array.isArray(serviceIds)) {
      parsedServiceIds = serviceIds.filter(Boolean);
    } else if (typeof serviceIds === "string" && serviceIds.trim()) {
      try {
        const temp = JSON.parse(serviceIds);
        parsedServiceIds = Array.isArray(temp) ? temp.filter(Boolean) : [];
      } catch {
        parsedServiceIds = parseCsvArray(serviceIds);
      }
    }

    // parse workingSlots
    let parsedWorkingSlots = [];
    if (Array.isArray(workingSlots)) {
      parsedWorkingSlots = workingSlots;
    } else if (typeof workingSlots === "string" && workingSlots.trim()) {
      try {
        const temp = JSON.parse(workingSlots);
        parsedWorkingSlots = Array.isArray(temp) ? temp : [];
      } catch {
        parsedWorkingSlots = [];
      }
    }

    parsedWorkingSlots = normalizeWorkingSlots(parsedWorkingSlots);

    // validate selected services
    const services = parsedServiceIds.length
      ? await Service.find({
          _id: { $in: parsedServiceIds },
          isActive: true,
        }).select("title category")
      : [];

    const validServiceIds = services.map((s) => s._id);
    const serviceCategoryNames = extractServiceCategoryNames(services);

    const documentUrl = req.file
      ? `/uploads/join-docs/${req.file.filename}`
      : "";

    const saved = await JoinInquiry.create({
      userId: user._id,
      fullName: cleanString(fullName),
      phone: cleanString(phone),
      gender,
      email: cleanString(email).toLowerCase(),
      dob: cleanString(dob),
      education: {
        degree: cleanString(degree),
        institute: cleanString(institute),
        passingYear: cleanString(passingYear),
      },
      professional: {
        experienceYears: cleanString(experienceYears),
        currentRole: cleanString(currentRole),
        about: cleanString(about),
      },
      skills: skillsArray,
      serviceIds: validServiceIds,
      serviceCategoryNames,
      city: cleanString(city),
      addressLine1: cleanString(addressLine1),
      pincode: cleanString(pincode),
      workingSlots: parsedWorkingSlots,
      documentUrl,
      status: "pending",
    });

    return res.status(201).json({
      message: "Inquiry submitted successfully",
      data: saved,
    });
  } catch (err) {
    console.error("createJoinInquiry error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ADMIN: list inquiries
exports.adminGetJoinInquiries = async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;

    const query = {};
    if (status !== "all") query.status = status;

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { fullName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { pincode: { $regex: s, $options: "i" } },
        { "education.degree": { $regex: s, $options: "i" } },
        { "professional.currentRole": { $regex: s, $options: "i" } },
        { serviceCategoryNames: { $regex: s, $options: "i" } },
      ];
    }

    const items = await JoinInquiry.find(query)
      .populate("userId", "email role profile.name profile.phone profile.city profile.image")
      .populate("reviewedBy", "email profile.name")
      .populate("approvedUserId", "email role profile.name")
      .populate("serviceIds", "title category")
      .sort({ createdAt: -1 });

    return res.json({ items });
  } catch (err) {
    console.error("adminGetJoinInquiries error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ADMIN: approve / reject inquiry
exports.adminUpdateJoinStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      rejectionReason = "",
      approvalNotes = "",
      allowDirectCustomerContact = true,
    } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const inquiry = await JoinInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (inquiry.status === "approved" && status === "approved") {
      return res.status(409).json({ message: "Inquiry already approved" });
    }

    if (inquiry.status === "rejected" && status === "rejected") {
      return res.status(409).json({ message: "Inquiry already rejected" });
    }

    // REJECT
    if (status === "rejected") {
      inquiry.status = "rejected";
      inquiry.reviewedBy = req.user._id;
      inquiry.reviewedAt = new Date();
      inquiry.rejectionReason = cleanString(rejectionReason);
      inquiry.approvalNotes = "";
      await inquiry.save();

      return res.json({
        message: "Inquiry rejected successfully",
        data: inquiry,
      });
    }

    // APPROVE
    let user = null;

    if (inquiry.userId) {
      user = await User.findById(inquiry.userId);
    }

    // fallback for old inquiry records
    if (!user && inquiry.email) {
      user = await User.findOne({ email: cleanString(inquiry.email).toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        message: "Linked user account not found for this inquiry",
      });
    }

    let services = [];
    if (Array.isArray(inquiry.serviceIds) && inquiry.serviceIds.length > 0) {
      services = await Service.find({
        _id: { $in: inquiry.serviceIds },
      }).select("title category");
    }

    const serviceCategoryNames = extractServiceCategoryNames(
      services,
      inquiry.serviceCategoryNames
    );

    user.role = "partner";
    user.partner = user.partner || {};
    user.profile = user.profile || {};

    // partner approval basics
    user.partner.isApproved = true;
    user.partner.isAvailable = true;
    user.partner.allowDirectCustomerContact =
      allowDirectCustomerContact !== false;
    user.partner.joinInquiryId = inquiry._id;
    user.partner.approvedAt = new Date();
    user.partner.approvedBy = req.user._id;

    // service mapping
    user.partner.serviceIds = Array.isArray(inquiry.serviceIds)
      ? inquiry.serviceIds.filter(Boolean)
      : [];

    user.partner.serviceCategories = serviceCategoryNames;

    // coverage
    user.partner.cities = inquiry.city ? [cleanString(inquiry.city)] : [];
    user.partner.pincodes = inquiry.pincode ? [cleanString(inquiry.pincode)] : [];

    // schedule
    user.partner.workingSlots = normalizeWorkingSlots(inquiry.workingSlots);

    // defaults for assignment engine
    if (!user.partner.maxBookingsPerDay) user.partner.maxBookingsPerDay = 5;
    if (typeof user.partner.priority !== "number") user.partner.priority = 0;
    if (typeof user.partner.averageRating !== "number") user.partner.averageRating = 0;
    if (typeof user.partner.totalCompletedJobs !== "number") {
      user.partner.totalCompletedJobs = 0;
    }

    // optional professional details
    user.partner.experienceYears = Number(inquiry?.professional?.experienceYears || 0) || 0;
    user.partner.bio = cleanString(inquiry?.professional?.about);

    // sync basic profile from inquiry
    user.profile.name = cleanString(inquiry.fullName) || user.profile.name || "";
    user.profile.phone = cleanString(inquiry.phone) || user.profile.phone || "";
    user.profile.city = cleanString(inquiry.city) || user.profile.city || "";

    await user.save();

    inquiry.status = "approved";
    inquiry.reviewedBy = req.user._id;
    inquiry.reviewedAt = new Date();
    inquiry.rejectionReason = "";
    inquiry.approvalNotes = cleanString(approvalNotes);
    inquiry.approvedUserId = user._id;

    await inquiry.save();

    return res.json({
      message: "Inquiry approved and user converted to partner successfully",
      data: {
        inquiry,
        user,
      },
    });
  } catch (err) {
    console.error("adminUpdateJoinStatus error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ADMIN: delete
exports.adminDeleteJoinInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await JoinInquiry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.json({ message: "Inquiry deleted" });
  } catch (err) {
    console.error("adminDeleteJoinInquiry error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};