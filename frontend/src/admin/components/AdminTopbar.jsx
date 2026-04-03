import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserCircle, LogOut, User, Menu } from "lucide-react";

export default function AdminTopbar({ onLogout, onMenuClick, collapsed }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ ONLY admin (no fallback to user)
  const admin = JSON.parse(localStorage.getItem("admin") || "null");
  const adminToken = localStorage.getItem("adminToken") || admin?.token;

  const adminName = admin?.name || admin?.fullName || admin?.username || "Admin";
  const adminRole = admin?.role || "admin";

  // ✅ if admin not logged in -> go to admin login
  useEffect(() => {
    if (!adminToken || adminRole !== "admin") {
      navigate("/admin/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    // ✅ use parent logout if provided
    if (onLogout) return onLogout();

    // ✅ Admin logout removes ONLY admin session
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    window.dispatchEvent(new Event("authChanged"));
    navigate("/admin/login");
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/90 backdrop-blur border-b flex items-center justify-between px-6 z-50 transition-all duration-300
      ${collapsed ? "left-20" : "left-64"}`}
    >
      {/* LEFT: Menu Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl border hover:bg-gray-50 grid place-items-center transition"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} className="text-gray-700" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-bold text-gray-900">Admin Panel</p>
          <p className="text-xs text-gray-500">Manage services, users & bookings</p>
        </div>
      </div>

      {/* RIGHT: Profile Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 border bg-white transition"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <UserCircle size={28} className="text-indigo-600" />
          </div>

          <div className="leading-tight text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 max-w-[150px] truncate">
              {adminName}
            </p>
            <p className="text-xs text-gray-500">{adminRole}</p>
          </div>

          <ChevronDown
            size={18}
            className={`text-gray-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-52 rounded-2xl border bg-white shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin/profile");
              }}
              className="w-full px-4 py-3 text-sm flex items-center gap-2 hover:bg-gray-50"
            >
              <User size={16} className="text-indigo-600" />
              My Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full px-4 py-3 text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}