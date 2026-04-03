import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  ArrowLeft,
  Star,
  List,
  PhoneCall,
  UserRound,
  MessageCircle,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { getUserBookingDetailsApi } from "../services/api";

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₹${num}`;
}

function normalizePhone(phone = "") {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function buildWhatsAppLink(phone = "", text = "") {
  const clean = normalizePhone(phone).replace(/^\+/, "");
  if (!clean) return "";
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

function getPartnerStatusText(assistedPartner) {
  if (!assistedPartner) return "Partner details not available";
  if (assistedPartner.partnerResponseStatus === "Accepted") {
    return "Partner accepted your booking";
  }
  if (assistedPartner.partnerResponseStatus === "Rejected") {
    return "Partner is currently unavailable";
  }
  if (
    assistedPartner.assignmentStatus === "Assigned" ||
    assistedPartner.assignmentStatus === "Reassigned"
  ) {
    return "Partner selected and awaiting confirmation";
  }
  return "Partner status updating";
}

export default function BookingConfirmed() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const initialBooking = state?.booking || null;

  const [booking, setBooking] = useState(initialBooking);
  const [assistedPartner, setAssistedPartner] = useState(null);
  const [loading, setLoading] = useState(false);

  const bookingId = initialBooking?._id || booking?._id || "";

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        const res = await getUserBookingDetailsApi(bookingId);

        if (res?.data?.booking) {
          setBooking(res.data.booking);
        }

        setAssistedPartner(res?.data?.assistedPartner || null);
      } catch (err) {
        console.log("Failed to load booking details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingId]);

  const partnerPhone = useMemo(
    () => normalizePhone(assistedPartner?.phone || ""),
    [assistedPartner],
  );

  const whatsappLink = useMemo(() => {
    return buildWhatsAppLink(
      assistedPartner?.phone || "",
      `Hello ${assistedPartner?.name || "Partner"}, I booked ${booking?.serviceTitle || "a service"} and wanted to connect regarding my booking.`,
    );
  }, [assistedPartner, booking]);

  const partnerImage = assistedPartner?.image
    ? assistedPartner.image.startsWith("http")
      ? assistedPartner.image
      : `http://localhost:5000${assistedPartner.image}`
    : "";

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            No booking found
          </h2>
          <p className="text-slate-500 mt-2">
            We couldn't find any recent booking data. Please try booking again.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const canCallPartner =
    !!assistedPartner?.contactEnabled &&
    !!partnerPhone &&
    assistedPartner?.partnerResponseStatus !== "Rejected";

  const canWhatsappPartner =
    !!assistedPartner?.contactEnabled &&
    !!whatsappLink &&
    assistedPartner?.partnerResponseStatus !== "Rejected";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="relative max-w-5xl mx-auto px-6 pt-12">
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-100">
          {/* Top Section */}
          <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Booking Confirmed!
                  </h1>
                  <p className="text-slate-500 font-medium">
                    Order ID: #{booking._id?.slice(-6).toUpperCase() || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="self-start px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wider border border-green-200">
                  {booking.bookingStatus || "Confirmed"}
                </span>

                {booking.assignmentStatus ? (
                  <span className="self-start px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider border border-indigo-200">
                    {booking.assignmentStatus}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              {/* Left */}
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <Package size={18} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Service Detail
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {booking.serviceTitle || "Service Name"}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {booking.serviceCategory || "General"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <Star size={18} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Plan
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {booking.packageName}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {formatCurrency(
                        booking.finalPrice ||
                          booking.packagePrice ||
                          booking.amount,
                      )}{" "}
                      • {booking.durationMins || 0} mins
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <Calendar size={18} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Schedule
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {formatDate(booking?.slot?.date)}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {booking?.slot?.time || "-"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <CreditCard size={18} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Payment
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {booking.paymentMethod}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      Status:{" "}
                      <span
                        className={
                          booking.paymentStatus === "Paid"
                            ? "text-green-600 font-bold"
                            : "text-amber-600 font-bold"
                        }
                      >
                        {booking.paymentStatus || "Unpaid"}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <MapPin size={18} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Location
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">
                      {booking?.address?.line1 || "-"}
                    </p>
                    <div className="mt-1 text-sm text-slate-500 font-medium flex flex-wrap gap-x-3 gap-y-1">
                      {booking?.address?.city ? (
                        <span>{booking.address.city}</span>
                      ) : null}
                      {booking?.address?.state ? (
                        <span>{booking.address.state}</span>
                      ) : null}
                      {booking?.address?.pincode ? (
                        <span>Pincode: {booking.address.pincode}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    Home
                  </button>

                  <button
                    onClick={() => navigate(`/rate/${booking._id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all"
                  >
                    <Star size={18} />
                    Rate Service
                  </button>

                  <button
                    onClick={() => navigate("/my-bookings")}
                    className="flex-[1.2] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all"
                  >
                    <List size={18} />
                    Manage Bookings
                  </button>
                </div>
              </div>

              {/* Right - Assisted Partner */}
              <div>
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-[0.18em]">
                      Assisted Partner
                    </span>
                  </div>

                  {loading ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-sm font-semibold text-slate-500">
                        Loading partner details...
                      </p>
                    </div>
                  ) : assistedPartner ? (
                    <div className="mt-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-indigo-50 border border-slate-200 flex items-center justify-center shrink-0">
                            {partnerImage ? (
                              <img
                                src={partnerImage}
                                alt={assistedPartner.name || "Partner"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound
                                className="text-indigo-600"
                                size={28}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-black text-slate-900">
                              {assistedPartner.name || "Assigned Partner"}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                              <Clock3 size={15} />
                              <span>
                                {getPartnerStatusText(assistedPartner)}
                              </span>
                            </div>

                            {assistedPartner.city ? (
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={15} />
                                <span>{assistedPartner.city}</span>
                              </div>
                            ) : null}

                            {assistedPartner.phone ? (
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <PhoneCall size={15} />
                                <span>{assistedPartner.phone}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {canCallPartner ? (
                            <a
                              href={`tel:${partnerPhone}`}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
                            >
                              <PhoneCall size={17} />
                              Call Partner
                            </a>
                          ) : (
                            <button
                              disabled
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed"
                            >
                              <PhoneCall size={17} />
                              Call Unavailable
                            </button>
                          )}

                          {canWhatsappPartner ? (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                            >
                              <MessageCircle size={17} />
                              WhatsApp Partner
                            </a>
                          ) : (
                            <button
                              disabled
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                            >
                              <MessageCircle size={17} />
                              WhatsApp Unavailable
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <p className="text-sm font-semibold text-indigo-900">
                          Your assigned service partner is connected to this
                          booking.
                        </p>
                        <p className="mt-1 text-xs text-indigo-700 leading-5">
                          You can contact the partner directly when contact is
                          enabled. If the partner has not yet accepted, details
                          may update shortly.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                      <p className="font-bold text-slate-800">
                        No partner details available.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        This booking was created without a visible partner
                        snapshot.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">
                    Booking Summary
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(
                          booking.finalPrice ||
                            booking.amount ||
                            booking.packagePrice,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Payment</span>
                      <span className="font-semibold text-slate-900">
                        {booking.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Assignment</span>
                      <span className="font-semibold text-slate-900">
                        {booking.assignmentStatus || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          A confirmation email has been sent to your registered address.
        </p>
      </div>
    </div>
  );
}
