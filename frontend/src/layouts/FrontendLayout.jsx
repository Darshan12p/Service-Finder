import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function FrontendLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_28%,#faf5ff_63%,#ecfeff_100%)] text-slate-900">
      <div className="relative min-h-screen overflow-hidden">
        {/* global soft background lights */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 -right-24 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10">
          <Navbar />
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  );
}