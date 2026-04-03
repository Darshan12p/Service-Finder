const User = require("../models/User");

// GET /api/addresses/:userId
exports.getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/addresses/:userId
exports.addUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      label = "Home",
      line1,
      city = "",
      state = "",
      pincode = "",
      houseNo = "",
      landmark = "",
      lat = null,
      lng = null,
      source = "manual",
    } = req.body;

    if (!line1 || !line1.trim()) {
      return res.status(400).json({ message: "line1 is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

   user.addresses.push({
  label,
  line1: line1.trim(),
  city: String(city || "").trim(),
  state: String(state || "").trim(),
  pincode: String(pincode || "").trim(),
  houseNo: String(houseNo || "").trim(),
  landmark: String(landmark || "").trim(),
  lat: lat !== null ? Number(lat) : null,
  lng: lng !== null ? Number(lng) : null,
  source,
});

    await user.save();

    res.json({ message: "Address added", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
