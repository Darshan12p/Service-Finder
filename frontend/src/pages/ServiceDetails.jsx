// ✅ Path: frontend/src/pages/ServiceDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getServiceByIdApi } from "../services/api";
import { CheckCircle2, Clock, IndianRupee, ArrowLeft, MessageSquareText } from "lucide-react";

// ✅ NEW (reviews)
import ReviewSection from "../components/ReviewSection";
import StarRating from "../components/StarRating";

const clampStyle = (lines) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getServiceByIdApi(id);
        const svc = res?.data?.service;
        setService(svc || null);

        const pkgs = (svc?.packages || []).filter((p) => p.isActive !== false);
        if (pkgs.length) setSelected(pkgs[0]);
      } catch (e) {
        console.log(e);
        setService(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const packages = useMemo(() => {
    const pkgs = service?.packages || [];
    return pkgs
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [service]);

  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
  const imageSrc = useMemo(() => {
    const raw = service?.imageUrl || service?.image || "";
    if (!raw) return "";
    return raw.startsWith("http") ? raw : `${apiBase}${raw}`;
  }, [service, apiBase]);

  const title = service?.title || "Service";
  const category = service?.categoryName || service?.category || service?.serviceCategory || "";
  const description =
    service?.description ||
    "Choose the best package for your needs — verified professionals at your doorstep.";

  const isSamePkg = (a, b) =>
    (a?.name || "") === (b?.name || "") && Number(a?.price || 0) === Number(b?.price || 0);

  const onContinue = () => {
    if (!selected || !service?._id) return;
    navigate("/checkout", {
      state: {
        serviceId: service._id,
        serviceTitle: service.title,
        serviceCategory: category,
        package: selected,
      },
    });
  };

  // ✅ NEW: scroll to review section
  const scrollToReviews = () => {
    const el = document.getElementById("reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="rounded-[36px] border bg-white p-6 shadow-sm">
            <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
            <div className="mt-4 h-4 w-80 bg-gray-200 rounded animate-pulse" />
            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center p-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-extrabold text-gray-900">Service not found</h2>
          <p className="text-gray-600 mt-2">Please go back and try again.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 w-full rounded-2xl bg-indigo-600 text-white py-3 font-bold hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Verified Partner
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border">
              Instant Booking
            </span>
          </div>
        </div>

        {/* Premium container */}
        <div className="mt-6 rounded-[36px] border bg-gradient-to-br from-indigo-50 via-white to-white shadow-sm overflow-hidden">
          {/* HERO */}
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="relative min-h-[280px] lg:min-h-[360px]">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

              <div className="relative p-6 sm:p-10">
                <h1 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight" style={clampStyle(3)}>
                  {title}
                </h1>
                <p className="mt-3 text-white/90 text-sm sm:text-base">{category}</p>
                <p className="mt-5 text-white/90 text-sm sm:text-base max-w-xl" style={clampStyle(4)}>
                  {description}
                </p>

                {/* ✅ NEW: rating + write review button (BEST POSITION) */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 backdrop-blur">
                    <StarRating value={Number(service?.avgRating || 0)} readOnly size={18} />
                    <span className="text-white text-xs font-bold">
                      {Number(service?.avgRating || 0).toFixed(1)} ({service?.ratingCount || 0})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToReviews}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/20 backdrop-blur"
                  >
                    <MessageSquareText size={16} />
                    Write Review
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 backdrop-blur">
                    Verified Experts
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 backdrop-blur">
                    Fast Booking
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 backdrop-blur">
                    Doorstep Service
                  </span>
                </div>
              </div>
            </div>

            {/* Right header area */}
            <div className="p-6 sm:p-10">
              <h2 className="text-2xl font-extrabold text-gray-900">Choose a Package</h2>
              <p className="mt-2 text-gray-600">Select the best package for your needs.</p>

              {/* Packages */}
              {packages.length === 0 ? (
                <div className="mt-6 rounded-2xl border bg-white p-5 text-gray-600">
                  No packages added yet. (Admin must add Basic / Standard / Premium)
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                  {packages.slice(0, 3).map((p) => {
                    const active = isSamePkg(selected, p);

                    return (
                      <button
                        key={`${p.name}-${p.price}`}
                        type="button"
                        onClick={() => setSelected(p)}
                        className={`text-left rounded-3xl border bg-white p-5 shadow-sm transition flex flex-col min-h-[360px]
                          ${active ? "border-indigo-600 ring-2 ring-indigo-100" : "hover:shadow-md hover:-translate-y-0.5"}`}
                      >
                        {/* top */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-extrabold text-indigo-600">{p.name}</div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <IndianRupee size={16} />
                              <span className="text-3xl font-extrabold text-gray-900">{Number(p.price || 0)}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={16} />
                              Duration: <span className="font-semibold">{p.durationMins || 60} mins</span>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              p.isActive !== false
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {/* includes */}
                        <div className="mt-5">
                          <div className="text-sm font-extrabold text-gray-900">Includes</div>

                          {(p.features || []).length ? (
                            <ul className="mt-3 space-y-2 text-sm text-gray-700">
                              {(p.features || []).slice(0, 4).map((f, i) => (
                                <li key={i} className="flex gap-2">
                                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                                  <span style={clampStyle(2)}>{f}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm text-gray-500">
                              Package details will be shown here (Admin can add features).
                            </p>
                          )}
                        </div>

                        {/* bottom button */}
                        <div className="mt-auto pt-6">
                          <div
                            className={`w-full text-center py-3 rounded-2xl font-extrabold transition ${
                              active ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {active ? "Selected" : "Select Package"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar (Summary) */}
          <div className="border-t bg-white p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Selected Package</p>
                {selected ? (
                  <p className="text-lg font-extrabold text-gray-900">
                    {selected.name} • ₹{Number(selected.price || 0)} • {selected.durationMins || 60} mins
                  </p>
                ) : (
                  <p className="text-gray-600">Please select a package to continue.</p>
                )}
              </div>

              <button
                disabled={!selected}
                onClick={onContinue}
                className="w-full sm:w-auto rounded-2xl bg-indigo-600 px-8 py-3 text-white font-extrabold
                           hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Reviews section (dynamic from backend) */}
        <ReviewSection serviceId={service?._id || id} />
      </div>
    </section>
  );
}