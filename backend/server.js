const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const app = express();

dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================== AUTH ======================
app.use("/api", require("./routes/authRoutes"));

// ====================== PUBLIC ======================
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/join-us", require("./routes/joinInquiryRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

// ====================== ADMIN ======================
app.use("/api/admin", require("./routes/adminDashboardRoutes"));
app.use("/api/admin", require("./routes/adminSeedRoutes"));
app.use("/api/admin", require("./routes/adminBookingRoutes"));
app.use("/api/admin", require("./routes/adminServiceRoutes"));
app.use("/api/admin", require("./routes/adminUserRoutes"));
app.use("/api/admin", require("./routes/adminContactRoutes"));
app.use("/api/admin", require("./routes/adminJoinInquiryRoutes"));
app.use("/api/admin", require("./routes/adminReviewRoutes"));
app.use("/api/admin/offers", require("./routes/adminOfferRoutes"));
app.use("/api/admin/categories", require("./routes/adminCategoryRoutes"));

// ====================== STATIC FILES ======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/payments", require("./routes/paymentRoutes"));

app.use("/api/admin/payments", require("./routes/adminPaymentRoutes"));

app.use("/api/admin/profile", require("./routes/adminProfileRoutes"));

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});