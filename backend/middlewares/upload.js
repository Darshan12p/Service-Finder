const multer = require("multer");
const path = require("path");
const fs = require("fs");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeFilename(prefix, originalname) {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/\s+/g, "_");
  return `${prefix}-${Date.now()}-${base}${ext}`;
}

/* ======================= IMAGE FILTER ======================= */
function imageFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG/PNG/WEBP allowed"), false);
  }
  cb(null, true);
}

/* ======================= JOIN FILTER (PDF + IMAGES) ======================= */
function joinDocFilter(req, file, cb) {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF/JPG/PNG/WEBP allowed"), false);
  }
  cb(null, true);
}

/* ======================= CATEGORY IMAGE (SAVE IN uploads/) ======================= */
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ store directly inside backend/uploads
    const dir = path.join(__dirname, "..", "uploads");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, safeFilename("category", file.originalname)),
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
  fileFilter: imageFilter,
});

/* ======================= SERVICE IMAGE (SAVE IN uploads/services) ======================= */
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "services");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, safeFilename("service", file.originalname)),
});

const uploadServiceImage = multer({
  storage: serviceStorage,
  fileFilter: imageFilter,
});

/* ======================= JOIN DOCUMENT (SAVE IN uploads/join-docs) ======================= */
const joinStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "join-docs");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, safeFilename("join", file.originalname)),
});

const uploadJoinDocument = multer({
  storage: joinStorage,
  fileFilter: joinDocFilter,
});

module.exports = {
  uploadCategoryImage,
  uploadServiceImage,
  uploadJoinDocument,
};
