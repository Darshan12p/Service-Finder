const ContactMessage = require("../models/ContactMessage");

// PUBLIC: user submits contact form
exports.createContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, description } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !mobile?.trim() || !email?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const saved = await ContactMessage.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      description: description.trim(),
    });

    res.status(201).json({ message: "Message sent successfully", data: saved });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: list messages
exports.adminGetMessages = async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;

    const query = {};
    if (status === "pending") query.status = "pending";
    if (status === "resolved") query.status = "resolved";

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { mobile: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const items = await ContactMessage.find(query).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: toggle status
exports.adminToggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = msg.status === "pending" ? "resolved" : "pending";
    await msg.save();

    res.json({ message: "Status updated", data: msg });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN: delete
exports.adminDeleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Message not found" });

    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
