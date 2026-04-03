const Offer = require("../models/Offer");

// PUBLIC: only active offers
exports.getActiveOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
