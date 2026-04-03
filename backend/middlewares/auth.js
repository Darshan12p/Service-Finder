// backend/middlewares/auth.js
const { verifyToken } = require("../utils/jwt");

function protect(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyToken(token);

    // ✅ IMPORTANT: set _id so controllers using req.user._id work
    req.user = {
      _id: decoded.id,      // ✅ this fixes your 401 in review controller
      id: decoded.id,       // (keep both)
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.log("❌ JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only" });
}

module.exports = { protect, adminOnly };