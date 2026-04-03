import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Gift,
  CreditCard,
  Headphones,
  Briefcase,
  LogOut,
  Layers,
  Menu,
} from "lucide-react";
import AdminTopbar from "../components/AdminTopbar";

export default function AdminLayout() {
  const [openUsers, setOpenUsers] = useState(true);
  const [collapsed, setCollapsed] = useState(false); // ✅ NEW
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
     ${
       isActive
         ? "bg-indigo-50 text-indigo-600"
         : "text-gray-600 hover:bg-gray-100"
     }`;

  const subLinkClass = ({ isActive }) =>
    `px-10 py-2 text-sm block transition
     ${isActive ? "text-indigo-600" : "text-gray-500 hover:text-indigo-600"}`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`bg-white border-r fixed left-0 top-0 h-screen flex flex-col transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="px-4 py-6 overflow-y-auto">
          {/* Logo */}
          <h1
            className={`text-2xl font-bold text-indigo-600 mb-8 transition-all
            ${collapsed ? "text-center text-lg" : ""}`}
          >
            {collapsed ? "SF" : "Service Finder"}
          </h1>

          <NavLink to="dashboard" className={linkClass}>
            <LayoutDashboard size={18} />
            {!collapsed && "Dashboard"}
          </NavLink>

          <NavLink to="services" className={linkClass}>
            <Briefcase size={18} />
            {!collapsed && "Service Management"}
          </NavLink>

          <NavLink to="categories" className={linkClass}>
            <Layers size={18} />
            {!collapsed && "Categories"}
          </NavLink>

          {/* USERS */}
          <div className="mt-4">
            <button
              onClick={() => setOpenUsers(!openUsers)}
              className="flex justify-between w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm"
            >
              <span className="flex gap-3 items-center">
                <Users size={18} />
                {!collapsed && "Users"}
              </span>
              {!collapsed && (openUsers ? "▴" : "▾")}
            </button>

            {openUsers && !collapsed && (
              <>
                <NavLink to="users/customers" className={subLinkClass}>
                  Customers
                </NavLink>
                <NavLink to="users/servicepartners" className={subLinkClass}>
                  Partners
                </NavLink>
                <NavLink to="users/admin-users" className={subLinkClass}>
                  Admins
                </NavLink>
              </>
            )}
          </div>

          <NavLink to="bookingmanagement" className={linkClass}>
            <CalendarCheck size={18} />
            {!collapsed && "Bookings"}
          </NavLink>

          <NavLink to="offers" className={linkClass}>
            <Gift size={18} />
            {!collapsed && "Offers"}
          </NavLink>

          <NavLink to="paymentstransactions" className={linkClass}>
            <CreditCard size={18} />
            {!collapsed && "Payments"}
          </NavLink>

          <NavLink to="contact-messages" className={linkClass}>
            <Headphones size={18} />
            {!collapsed && "Messages"}
          </NavLink>

          <NavLink to="join-inquiries" className={linkClass}>
            <CreditCard size={18} />
            {!collapsed && "Inquiries"}
          </NavLink>

          <NavLink to="/admin/reviews" className={linkClass}>
            <CreditCard size={18} />
            {!collapsed && "Reviews"}
          </NavLink>
        </div>

        {/* Logout */}
        <div className="mt-auto px-4 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* TOPBAR */}
      <AdminTopbar
        onLogout={handleLogout}
        onMenuClick={() => setCollapsed(!collapsed)}
        collapsed={collapsed}
      />

      {/* MAIN */}
      <main
        className={`flex-1 mt-16 p-6 transition-all duration-300
        ${collapsed ? "ml-20" : "ml-64"}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
