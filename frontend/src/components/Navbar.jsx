import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  CalendarDays,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const syncUser = () => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();
  }, []);

  useEffect(() => {
    syncUser();
    setUserMenuOpen(false);
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => syncUser();
    window.addEventListener("authChanged", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("authChanged", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    setUser(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event("authChanged"));
    navigate("/");
  };

  const displayName =
    user?.name || user?.fullName || user?.username || user?.email || "User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const linkClass = ({ isActive }) =>
    `relative px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/20"
        : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
    }`;

  const goMyBookings = () => {
    setUserMenuOpen(false);
    setOpen(false);

    const raw = localStorage.getItem("user");
    if (!raw) return navigate("/sign");

    navigate("/my-bookings");
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 border-b border-white/20 bg-gradient-to-br from-indigo-100 backdrop-blur-2xl" />
      <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-indigo-100/40 via-fuchsia-100/30 to-cyan-100/40 pointer-events-none" />

      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 blur-md opacity-60 group-hover:opacity-80 transition" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white grid place-items-center font-extrabold shadow-xl">
              SF
            </div>
          </div>

          <div className="text-left">
            <p className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Service Finder
            </p>
            <p className="text-xs text-slate-500 -mt-0.5">
              Premium doorstep services
            </p>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/50 bg-white/60 backdrop-blur-xl p-1.5 shadow-lg shadow-slate-200/40">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/services" className={linkClass}>
            Services
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact Us
          </NavLink>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <button
              onClick={() => navigate("/sign")}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />
              <span className="relative flex items-center gap-2">
                <Sparkles size={16} />
                Sign In
              </span>
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 blur-sm opacity-70" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white grid place-items-center font-bold text-sm">
                    {initials || "U"}
                  </div>
                </div>

                <div className="text-left leading-tight">
                  <div className="text-sm font-bold text-slate-900 max-w-40 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-slate-500">Welcome back</div>
                </div>

                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-300/30">
                  <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-fuchsia-50">
                    <p className="font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500">Manage your account</p>
                  </div>

                  <button
                    onClick={goMyBookings}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50/70 transition"
                  >
                    <CalendarDays size={18} />
                    My Bookings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50/70 transition"
                  >
                    <User size={18} />
                    Profile
                  </button>

                  <div className="h-px bg-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile button */}
        <button
          className="md:hidden w-11 h-11 rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-center"
          onClick={() => setOpen((p) => !p)}
          aria-label="menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden relative border-t border-white/30 bg-white/75 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            <NavLink onClick={() => setOpen(false)} to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/services" className={linkClass}>
              Services
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/contact" className={linkClass}>
              Contact Us
            </NavLink>

            {user && (
              <>
                <button
                  onClick={goMyBookings}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold text-left text-slate-700 hover:bg-indigo-50"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold text-left text-slate-700 hover:bg-indigo-50"
                >
                  Profile
                </button>
              </>
            )}

            {!user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/sign");
                }}
                className="mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="mt-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;