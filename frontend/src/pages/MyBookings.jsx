import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../services/api";
import { jsPDF } from "jspdf";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Search,
  ArrowUpDown,
  Home,
  Download,
  UserCheck,
  Phone,
  PhoneCall,
  Package,
  CheckCircle2,
  Wallet,
  BadgeIndianRupee,
  Star,
} from "lucide-react";

/* ---------------- helpers ---------------- */

const badge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-bold border";

  if (status === "Completed") {
    return `${base} bg-green-50 text-green-700 border-green-200`;
  }

  if (status === "Confirmed") {
    return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  }

  if (status === "Cancelled") {
    return `${base} bg-red-50 text-red-700 border-red-200`;
  }

  return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
};

const assignmentBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-bold border";

  if (status === "Accepted") {
    return `${base} bg-green-50 text-green-700 border-green-200`;
  }

  if (status === "Assigned") {
    return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
  }

  if (status === "Reassigned") {
    return `${base} bg-violet-50 text-violet-700 border-violet-200`;
  }

  if (status === "Rejected") {
    return `${base} bg-red-50 text-red-700 border-red-200`;
  }

  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
};

const paymentBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-bold border";

  if (status === "Paid") {
    return `${base} bg-green-50 text-green-700 border-green-200`;
  }

  if (status === "Failed") {
    return `${base} bg-red-50 text-red-700 border-red-200`;
  }

  if (status === "Refunded") {
    return `${base} bg-violet-50 text-violet-700 border-violet-200`;
  }

  return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
};

const safe = (v, fallback = "—") => (v ? v : fallback);

const safeParse = (value, fallback = null) => {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (ymd) => {
  if (!ymd) return "—";
  const d = new Date(ymd);
  if (String(d) === "Invalid Date") return ymd;

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (b) =>
  Number(b?.finalPrice || b?.amount || b?.packagePrice || 0);

const normalizePhone = (phone = "") =>
  String(phone || "").replace(/[^\d+]/g, "");

const canPayNow = (booking) => {
  const paymentMethod = String(booking?.paymentMethod || "");
  const paymentStatus = String(booking?.paymentStatus || "");
  const bookingStatus = String(booking?.bookingStatus || "");

  if (bookingStatus === "Cancelled") return false;
  if (paymentStatus === "Paid") return false;

  return paymentMethod === "Razorpay";
};

const canRatePartner = (booking) => {
  return (
    booking?.bookingStatus === "Completed" &&
    !!booking?.assignedPartnerId &&
    booking?.isReviewed !== true
  );
};

const isAlreadyReviewed = (booking) => {
  return booking?.isReviewed === true;
};

/* ---------------- page ---------------- */

export default function MyBookings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");

  const user = safeParse(localStorage.getItem("user"), null);
  const userId = user?._id;

  /* ---------------- fetch ---------------- */

  useEffect(() => {
    if (!userId) {
      navigate("/sign");
      return;
    }

    (async () => {
      try {
        setLoading(true);

        const apiTab =
          tab === "Completed"
            ? "completed"
            : tab === "Incomplete"
            ? "incomplete"
            : "all";

        const res = await getMyBookingsApi(userId, apiTab);
        setBookings(res?.data?.items || []);
      } catch (e) {
        console.log("getMyBookingsApi error:", e);
        navigate("/sign");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, userId, tab]);

  /* ---------------- counts ---------------- */

  const counts = useMemo(() => {
    const all = bookings.length;

    const completed = bookings.filter(
      (b) => b.bookingStatus === "Completed"
    ).length;

    const incomplete = bookings.filter(
      (b) => b.bookingStatus !== "Completed"
    ).length;

    return { all, completed, incomplete };
  }, [bookings]);

  /* ---------------- filter + sort ---------------- */

  const filtered = useMemo(() => {
    let list = [...bookings];

    if (tab === "Completed") {
      list = list.filter((b) => b.bookingStatus === "Completed");
    }

    if (tab === "Incomplete") {
      list = list.filter((b) => b.bookingStatus !== "Completed");
    }

    const s = q.trim().toLowerCase();

    if (s) {
      list = list.filter((b) => {
        const title = (b.serviceTitle || "").toLowerCase();
        const pkg = (b.packageName || "").toLowerCase();
        const addr = (b?.address?.line1 || "").toLowerCase();
        const partner = (
          b?.assignedPartnerSnapshot?.name ||
          b?.assignedPartnerName ||
          ""
        ).toLowerCase();
        const payMethod = (b?.paymentMethod || "").toLowerCase();
        const payStatus = (b?.paymentStatus || "").toLowerCase();
        const reviewWord = b?.isReviewed ? "reviewed" : "not reviewed";

        return (
          title.includes(s) ||
          pkg.includes(s) ||
          addr.includes(s) ||
          partner.includes(s) ||
          payMethod.includes(s) ||
          payStatus.includes(s) ||
          reviewWord.includes(s)
        );
      });
    }

    list.sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return sort === "oldest" ? da - db : db - da;
    });

    return list;
  }, [bookings, tab, q, sort]);

  /* ---------------- receipt ---------------- */

  const downloadReceipt = (b) => {
    const doc = new jsPDF();

    const partnerName =
      b?.assignedPartnerSnapshot?.name || b?.assignedPartnerName || "";
    const partnerPhone =
      b?.assignedPartnerSnapshot?.phone || b?.assignedPartnerPhone || "";

    doc.setFontSize(18);
    doc.text("Service Finder Receipt", 14, 20);

    doc.setFontSize(11);

    doc.text(`Booking ID: ${safe(b?._id)}`, 14, 32);
    doc.text(`Service: ${safe(b.serviceTitle)}`, 14, 40);
    doc.text(`Category: ${safe(b.serviceCategory)}`, 14, 48);
    doc.text(`Package: ${safe(b.packageName)}`, 14, 56);
    doc.text(`Amount: ₹${formatAmount(b)}`, 14, 64);

    doc.text(`Date: ${formatDate(b?.slot?.date)}`, 14, 72);
    doc.text(`Time: ${safe(b?.slot?.time)}`, 14, 80);

    doc.text(`Payment Method: ${safe(b?.paymentMethod)}`, 14, 88);
    doc.text(`Payment Status: ${safe(b?.paymentStatus)}`, 14, 96);
    doc.text(`Booking Status: ${safe(b?.bookingStatus)}`, 14, 104);

    doc.text(`Address: ${safe(b?.address?.line1)}`, 14, 112);

    if (partnerName) {
      doc.text(`Assigned Partner: ${partnerName}`, 14, 120);
    }

    if (partnerPhone) {
      doc.text(`Partner Phone: ${partnerPhone}`, 14, 128);
    }

    if (b?.razorpayPaymentId) {
      doc.text(`Razorpay Payment ID: ${b.razorpayPaymentId}`, 14, 136);
    }

    if (b?.isReviewed) {
      doc.text(`Review Status: Reviewed`, 14, 144);
    }

    doc.save(`booking-${b?._id?.slice(-6) || "receipt"}.pdf`);
  };

  const handleViewBooking = (booking) => {
    navigate("/booking/confirmed", {
      state: { booking },
    });
  };

  const handlePayNow = (booking) => {
    navigate("/booking/confirmed", {
      state: { booking, openPayment: true },
    });
  };

  const handleRatePartner = (booking) => {
    navigate(`/rate-service/${booking._id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Welcome back</p>
            <h1 className="text-2xl font-extrabold">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">
              All: {counts.all} • Incomplete: {counts.incomplete} • Completed:{" "}
              {counts.completed}
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 border px-4 py-2 rounded-xl hover:bg-gray-50"
          >
            <Home size={16} />
            Home
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["All", "Incomplete", "Completed"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3 ml-auto flex-wrap">
            <div className="flex items-center border rounded-xl px-3 py-2 gap-2">
              <Search size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search booking"
                className="outline-none text-sm"
              />
            </div>

            <div className="flex items-center border rounded-xl px-3 py-2 gap-2">
              <ArrowUpDown size={16} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="outline-none text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const partnerName =
                b?.assignedPartnerSnapshot?.name || b?.assignedPartnerName || "";
              const partnerPhone =
                b?.assignedPartnerSnapshot?.phone ||
                b?.assignedPartnerPhone ||
                "";

              const canCall =
                !!b?.contactPartnerEnabled &&
                !!partnerPhone &&
                b?.partnerResponseStatus !== "Rejected";

              const showPayNow = canPayNow(b);
              const showRatePartner = canRatePartner(b);
              const reviewed = isAlreadyReviewed(b);

              return (
                <div
                  key={b._id}
                  className="border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                      <p className="text-lg font-bold">{safe(b.serviceTitle)}</p>
                      <p className="text-sm text-gray-500">
                        {safe(b.serviceCategory)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={badge(b.bookingStatus)}>
                        {safe(b.bookingStatus)}
                      </span>

                      {b.paymentStatus ? (
                        <span className={paymentBadge(b.paymentStatus)}>
                          {safe(b.paymentStatus)}
                        </span>
                      ) : null}

                      {b.assignmentStatus ? (
                        <span className={assignmentBadge(b.assignmentStatus)}>
                          {safe(b.assignmentStatus)}
                        </span>
                      ) : null}

                      {reviewed ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                          Reviewed
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex gap-2 items-center">
                      <Calendar size={16} />
                      {formatDate(b?.slot?.date)}
                    </div>

                    <div className="flex gap-2 items-center">
                      <Clock size={16} />
                      {safe(b?.slot?.time)}
                    </div>

                    <div className="flex gap-2 items-center">
                      <BadgeIndianRupee size={16} />
                      ₹{formatAmount(b)}
                    </div>

                    <div className="flex gap-2 items-center">
                      <Package size={16} />
                      {safe(b?.packageName)}
                    </div>

                    <div className="flex gap-2 items-center">
                      <CreditCard size={16} />
                      {safe(b?.paymentMethod)}
                    </div>

                    <div className="flex gap-2 items-center md:col-span-2">
                      <MapPin size={16} />
                      {safe(b?.address?.line1)}
                    </div>
                  </div>

                  {b.assignedPartnerId ? (
                    <div className="mt-4 rounded-2xl border bg-indigo-50/40 p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <UserCheck size={16} className="text-indigo-600" />
                        <p className="text-sm font-bold text-gray-900">
                          Assisted Service Partner
                        </p>

                        <span className={assignmentBadge(b.assignmentStatus)}>
                          {safe(b.assignmentStatus, "Assigned")}
                        </span>

                        {b.partnerResponseStatus ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-white text-slate-700 border-slate-200">
                            {safe(b.partnerResponseStatus)}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">
                            Name:{" "}
                          </span>
                          <span className="text-gray-600">
                            {safe(partnerName)}
                          </span>
                        </div>

                        {partnerPhone ? (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            <span className="text-gray-600">
                              {safe(partnerPhone)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {reviewed && b?.reviewedAt ? (
                        <p className="mt-3 text-xs text-emerald-700 font-semibold">
                          Review submitted on {formatDate(b.reviewedAt)}
                        </p>
                      ) : null}

                      {canCall ? (
                        <div className="mt-3">
                          <a
                            href={`tel:${normalizePhone(partnerPhone)}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                          >
                            <PhoneCall size={15} />
                            Call Partner
                          </a>
                        </div>
                      ) : null}

                      {!b.contactPartnerEnabled && (
                        <p className="mt-3 text-xs text-slate-500">
                          Direct partner contact is not enabled yet.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border bg-yellow-50 p-4 text-sm text-yellow-800">
                      Service partner has not been assigned yet.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => handleViewBooking(b)}
                      className="border px-4 py-2 rounded-xl hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      View
                    </button>

                    {showPayNow ? (
                      <button
                        onClick={() => handlePayNow(b)}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                      >
                        <Wallet size={16} />
                        Pay Now
                      </button>
                    ) : null}

                    {showRatePartner ? (
                      <button
                        onClick={() => handleRatePartner(b)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
                      >
                        <Star size={16} />
                        Rate Partner
                      </button>
                    ) : null}

                    {reviewed ? (
                      <button
                        onClick={() => handleRatePartner(b)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-700 hover:bg-amber-100"
                      >
                        <Star size={16} />
                        Edit Review
                      </button>
                    ) : null}

                    <button
                      onClick={() => downloadReceipt(b)}
                      className="flex items-center gap-2 border px-4 py-2 rounded-xl text-indigo-600"
                    >
                      <Download size={16} />
                      Receipt
                    </button>

                    <button
                      onClick={() => navigate("/services")}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}