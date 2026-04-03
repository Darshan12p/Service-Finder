// backend/controllers/adminOfferController.js
const Offer = require("../models/Offer");
const Service = require("../models/Service");

// ✅ helper: clear offer snapshot in services
const clearOfferFromServices = async (offerId) => {
  await Service.updateMany(
    { "offer.offerId": offerId },
    {
      $set: {
        offer: {
          offerId: null,
          title: "",
          code: "",
          discountType: "percent",
          value: 0,
          isActive: false,
        },
      },
    }
  );
};

// ✅ helper: apply offer snapshot to selected services
const applyOfferToServices = async (offer, serviceIds = []) => {
  if (!serviceIds.length) return;

  await Service.updateMany(
    { _id: { $in: serviceIds } },
    {
      $set: {
        offer: {
          offerId: offer._id,
          title: offer.title,
          code: offer.code,
          discountType: offer.discountType,
          value: offer.value,
          isActive: offer.isActive,
        },
      },
    }
  );
};

// ADMIN: list offers (all)
exports.adminGetOffers = async (req, res) => {
  try {
    // include serviceIds
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: create offer
exports.adminCreateOffer = async (req, res) => {
  try {
    const { title, code, discountType, value, isActive } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });

    if (!code?.trim())
      return res.status(400).json({ message: "Code is required" });

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");

    const exists = await Offer.findOne({ code: normalizedCode });
    if (exists)
      return res.status(409).json({ message: "Offer code already exists" });

    const offer = await Offer.create({
      title: title.trim(),
      code: normalizedCode,
      discountType: discountType === "fixed" ? "fixed" : "percent",
      value: Number(value) || 0,
      isActive: typeof isActive === "boolean" ? isActive : true,

      // ✅ NEW: services list (initial empty)
      serviceIds: [],
    });

    res.status(201).json({ message: "Offer created", offer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: update offer (and update services snapshot if offer is already assigned)
exports.adminUpdateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, discountType, value, isActive } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    // update fields
    if (title !== undefined) offer.title = String(title).trim();
    if (code !== undefined)
      offer.code = String(code).trim().toUpperCase().replace(/\s+/g, "");
    if (discountType !== undefined)
      offer.discountType = discountType === "fixed" ? "fixed" : "percent";
    if (value !== undefined) offer.value = Number(value) || 0;
    if (isActive !== undefined) offer.isActive = !!isActive;

    await offer.save();

    // ✅ IMPORTANT: if offer is assigned to services, update snapshot in Service documents
    const serviceIds = Array.isArray(offer.serviceIds) ? offer.serviceIds : [];
    await clearOfferFromServices(offer._id);
    await applyOfferToServices(offer, serviceIds);

    res.json({ message: "Offer updated", offer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ NEW: assign offer to services
// PATCH /api/admin/offers/:id/services   body: { serviceIds: [] }
exports.adminAssignOfferServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceIds = [] } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    const ids = Array.isArray(serviceIds) ? serviceIds : [];

    // update offer.serviceIds
    offer.serviceIds = ids;
    await offer.save();

    // remove offer from all services first (clean)
    await clearOfferFromServices(offer._id);

    // apply offer snapshot to selected services
    await applyOfferToServices(offer, ids);

    res.json({ message: "Offer services updated", offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: toggle active/inactive (and update service snapshots too)
exports.adminToggleOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    offer.isActive = !offer.isActive;
    await offer.save();

    // ✅ update snapshot in all services that have this offer
    await Service.updateMany(
      { "offer.offerId": offer._id },
      { $set: { "offer.isActive": offer.isActive } }
    );

    res.json({ message: "Offer toggled", offer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: delete offer (remove offer from services also)
exports.adminDeleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    // ✅ remove from services
    await clearOfferFromServices(offer._id);

    res.json({ message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
