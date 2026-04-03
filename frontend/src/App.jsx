import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import FrontendLayout from "./layouts/FrontendLayout";

// Frontend Pages
import Home from "./Home";
import Sign from "./pages/Sign";
import ContactUs from "./pages/ContactUs";
import Services from "./pages/Services";
import Clickjoinus from "./pages/Clickjoinus";
import User from "./components/User";
import AllCategories from "./pages/AllCategories";
import ServiceDetails from "./pages/ServiceDetails";
import Search from "./pages/Search";
import BookingPage from "./pages/BookingPage";
import BookingConfirmed from "./pages/BookingConfirmed";
import MyBookings from "./pages/MyBookings";
import Profile1 from "./pages/Profile";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Careers from "./pages/Careers";
import Blogs from "./pages/Blogs";
import RateService from "./pages/RateService";
import AllReviews from "./pages/AllReviews";
import JoinSuccess from "./pages/JoinSuccess";

import RequireAuth from "./components/RequireAuth";

// Admin
import AdminLayout from "./admin/layouts/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import AdminServices from "./admin/pages/Services";
import BookingManagement from "./admin/pages/BookingManagement";
import Offers from "./admin/pages/Offers";
import PaymentsTransactions from "./admin/pages/PaymentsTransactions";
import ServiceCategories from "./admin/pages/ServiceCategories";
import ContactMessages from "./admin/pages/ContactMessages";
import JoinInquiries from "./admin/pages/JoinInquiries";
import Customers from "./admin/pages/users/Customers";
import ServicePartners from "./admin/pages/users/ServicePartners";
import AdminUsers from "./admin/pages/users/AdminUsers";
import Profile from "./admin/pages/Profile";
import Reviews from "./admin/pages/Reviews";
import AdminLogin from "./admin/pages/AdminLogin";

import AdminProtectedRoute from "./admin/routes/AdminProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= FRONTEND ================= */}
        <Route element={<FrontendLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/services" element={<Services />} />
          <Route path="/user" element={<User />} />
          <Route path="/categories" element={<AllCategories />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/search/:id" element={<Search />} />
          <Route path="/booking/confirmed" element={<BookingConfirmed />} />
          <Route path="/rate-service/:bookingId" element={<RateService />} />

          <Route
            path="/clickjoinus"
            element={
              <RequireAuth>
                <Clickjoinus />
              </RequireAuth>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile1 />
              </RequireAuth>
            }
          />

          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/reviews" element={<AllReviews />} />
          <Route path="/join-success" element={<JoinSuccess />} />

          <Route
            path="/rate/:bookingId"
            element={
              <RequireAuth>
                <RateService />
              </RequireAuth>
            }
          />

          <Route
            path="/booking"
            element={
              <RequireAuth>
                <BookingPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="bookingmanagement" element={<BookingManagement />} />
          <Route path="offers" element={<Offers />} />
          <Route path="paymentstransactions" element={<PaymentsTransactions />} />
          <Route path="categories" element={<ServiceCategories />} />
          <Route path="contact-messages" element={<ContactMessages />} />
          <Route path="join-inquiries" element={<JoinInquiries />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reviews" element={<Reviews />} />

          <Route path="users" element={<Outlet />}>
            <Route path="customers" element={<Customers />} />
            <Route path="servicepartners" element={<ServicePartners />} />
            <Route path="admin-users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;