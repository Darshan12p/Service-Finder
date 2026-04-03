import React, { useEffect, useMemo, useState } from "react";
import {
  assignPartnerManuallyApi,
  deleteBookingApi,
  getAssignablePartnersApi,
  getBookingsApi,
  updateBookingStatusApi,
} from "../../services/api";
import {
  Search as SearchIcon,
  Trash2,
  RefreshCw,
  Calendar,
  IndianRupee,
  User,
  UserCheck,
  Clock3,
  Users,
  Mail,
  Phone,
  MapPin,
  Package,
  BadgeCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";

const STATUS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

const badgeByStatus = (s) => {
  const st = String(s || "").toLowerCase();
  if (st === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (st === "confirmed") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (st === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (st === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const badgeByPayment = (s) => {
  const st = String(s || "").toLowerCase();
  if (st.includes("paid")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (st.includes("pending")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (st.includes("failed")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const badgeByAssignment = (s) => {
  const st = String(s || "").toLowerCase();
  if (st === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (st === "assigned") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (st === "reassigned") return "bg-violet-50 text-violet-700 border-violet-200";
  if (st === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  if (st === "unassigned") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const fmtDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const fmtMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const SafeText = ({ value, fallback = "-" }) => (
  <>{value !== undefined && value !== null && value !== "" ? value : fallback}</>
);

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${className}`}
  >
    {children}
  </span>
);

const SectionLabel = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
      <Icon size={16} className="text-slate-600" />
    </div>
    <p className="text-sm font-extrabold text-slate-900">{title}</p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, valueClass = "text-slate-900" }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className={`mt-2 text-2xl font-extrabold ${valueClass}`}>{value}</p>
      </div>
      <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon size={20} className="text-slate-700" />
      </div>
    </div>
  </div>
);

export default function BookingManagement() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState(null);
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [assigningPartnerId, setAssigningPartnerId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");
      const res = await getBookingsApi({ status, search, page: 1, limit: 100 });
      setItems(res?.data?.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load bookings");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onChangeStatus = async (id, bookingStatus) => {
    try {
      setUpdatingId(id);

      setItems((prev) =>
        prev.map((b) => (b._id === id ? { ...b, bookingStatus } : b))
      );

      const res = await updateBookingStatusApi(id, bookingStatus);
      const updated = res?.data?.booking;

      if (updated?._id) {
        setItems((prev) => prev.map((b) => (b._id === id ? updated : b)));
      }

      Swal.fire({
        icon: "success",
        title: "Status updated",
        text: `Booking marked as ${bookingStatus}`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || "Status update failed",
      });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  const onDelete = async (id) => {
    const booking = items.find((b) => b._id === id);

    const result = await Swal.fire({
      title: "Delete booking?",
      text: `This will permanently delete booking for ${booking?.customerName || "this customer"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteBookingApi(id);

      setItems((prev) => prev.filter((b) => b._id !== id));

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Booking has been deleted successfully.",
        confirmButtonColor: "#4f46e5",
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e?.response?.data?.message || "Delete failed",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  const openAssignModal = async (booking) => {
    try {
      setAssignOpen(true);
      setAssignBooking(booking);
      setPartnerOptions([]);
      setAssigningPartnerId("");
      setPartnersLoading(true);

      const res = await getAssignablePartnersApi(booking._id);
      setPartnerOptions(res?.data?.items || []);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: e?.response?.data?.message || "Could not load partners",
      });
      setAssignOpen(false);
      setAssignBooking(null);
    } finally {
      setPartnersLoading(false);
    }
  };

  const closeAssignModal = () => {
    setAssignOpen(false);
    setAssignBooking(null);
    setPartnerOptions([]);
    setAssigningPartnerId("");
    setPartnersLoading(false);
  };

  const onAssignPartner = async () => {
    if (!assignBooking?._id || !assigningPartnerId) {
      Swal.fire({
        icon: "warning",
        title: "Select partner",
        text: "Please select a partner first.",
      });
      return;
    }

    try {
      setPartnersLoading(true);

      const res = await assignPartnerManuallyApi(
        assignBooking._id,
        assigningPartnerId
      );

      const updated = res?.data?.booking;

      if (updated?._id) {
        setItems((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      }

      closeAssignModal();

      Swal.fire({
        icon: "success",
        title: "Partner assigned",
        text: "Partner has been assigned successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Assignment failed",
        text: e?.response?.data?.message || "Could not assign partner",
      });
    } finally {
      setPartnersLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((x) => x.bookingStatus === "Pending").length;
    const confirmed = items.filter((x) => x.bookingStatus === "Confirmed").length;
    const completed = items.filter((x) => x.bookingStatus === "Completed").length;
    const cancelled = items.filter((x) => x.bookingStatus === "Cancelled").length;
    const assigned = items.filter(
      (x) => String(x.assignmentStatus || "") !== "Unassigned" && x.assignedPartnerId
    ).length;
    const unassigned = items.filter(
      (x) => !x.assignedPartnerId || String(x.assignmentStatus || "") === "Unassigned"
    ).length;
    const revenue = items.reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      assigned,
      unassigned,
      revenue,
    };
  }, [items]);

  const StatusChip = ({ label }) => {
    const active = status === label;
    return (
      <button
        onClick={() => setStatus(label)}
        className={[
          "px-4 py-2.5 rounded-full text-sm font-extrabold border transition-all",
          active
            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Booking Management
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                Manage booking flow, assign partners, track payment status, and
                update lifecycle from one clean dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-extrabold text-slate-800 hover:bg-slate-50"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              {loading ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading...
                </div>
              ) : null}
            </div>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{msg}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <StatCard icon={Package} label="Total" value={stats.total} />
          <StatCard icon={Clock3} label="Pending" value={stats.pending} valueClass="text-amber-700" />
          <StatCard icon={BadgeCheck} label="Confirmed" value={stats.confirmed} valueClass="text-indigo-700" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} valueClass="text-emerald-700" />
          <StatCard icon={X} label="Cancelled" value={stats.cancelled} valueClass="text-rose-700" />
          <StatCard icon={Users} label="Assigned" value={stats.assigned} valueClass="text-blue-700" />
          <StatCard icon={UserCheck} label="Unassigned" value={stats.unassigned} valueClass="text-amber-700" />
          <StatCard icon={Wallet} label="Revenue" value={fmtMoney(stats.revenue)} />
        </div>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS.map((s) => (
                <StatusChip key={s} label={s} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <SearchIcon size={18} className="text-slate-500" />
                  <input
                    className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                    placeholder="Search name / email / service / address / partner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") load();
                    }}
                  />
                  <button
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-black"
                    onClick={load}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 flex items-center justify-between">
                <span>Showing bookings</span>
                <span className="font-extrabold text-slate-900">{items.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="mt-5 hidden 2xl:block rounded-[28px] border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <p className="font-extrabold text-slate-900 text-lg">All Bookings</p>
            <p className="text-sm text-slate-500">
              Assign, reassign, update status and track payment details.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-4 font-bold">Customer</th>
                  <th className="text-left p-4 font-bold">Service</th>
                  <th className="text-left p-4 font-bold">Slot</th>
                  <th className="text-left p-4 font-bold">Partner</th>
                  <th className="text-left p-4 font-bold">Payment</th>
                  <th className="text-left p-4 font-bold">Booking Status</th>
                  <th className="text-right p-4 font-bold">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((b) => {
                  const isUpdating = updatingId === b._id;

                  return (
                    <tr key={b._id} className="border-t border-slate-200 align-top hover:bg-slate-50/70">
                      <td className="p-4 w-[280px]">
                        <div className="space-y-2">
                          <div>
                            <div className="font-extrabold text-slate-900">{b.customerName}</div>
                            <div className="text-slate-500 flex items-center gap-2 mt-1">
                              <Mail size={14} />
                              <SafeText value={b.customerEmail} />
                            </div>
                            {b.phone ? (
                              <div className="text-slate-500 flex items-center gap-2 mt-1">
                                <Phone size={14} />
                                {b.phone}
                              </div>
                            ) : null}
                          </div>

                          {b?.address?.line1 ? (
                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                              <div className="flex items-start gap-2 text-slate-600">
                                <MapPin size={15} className="mt-0.5" />
                                <div className="leading-5">
                                  <div>{b.address.line1}</div>
                                  <div>
                                    {b.address.city ? `${b.address.city}` : ""}
                                    {b.address.pincode ? ` - ${b.address.pincode}` : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="p-4 w-[260px]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="font-extrabold text-slate-900">{b.serviceTitle}</div>
                          <div className="text-slate-500 mt-1">{b.serviceCategory || "-"}</div>

                          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Package
                            </div>
                            <div className="font-extrabold text-slate-900 mt-1">
                              <SafeText value={b.packageName} />
                            </div>
                            <div className="text-slate-600 text-xs mt-1">
                              <SafeText value={b.durationMins ? `${b.durationMins} mins` : "-"} />
                            </div>
                            <div className="text-slate-900 font-extrabold mt-2">
                              {fmtMoney(b.packagePrice)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 w-[180px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                            <Calendar size={16} className="text-slate-500" />
                            {fmtDate(b?.slot?.date)}
                          </div>
                          <div className="text-slate-600 mt-2 flex items-center gap-2">
                            <Clock3 size={14} />
                            <span>{b?.slot?.time || "-"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 min-w-[320px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                                <UserCheck size={18} className="text-slate-600" />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">
                                  {b.assignedPartnerId
                                    ? b.assignedPartnerName || "Assigned Partner"
                                    : "No Partner Assigned"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {b.assignedPartnerId ? "Partner details" : "Waiting for assignment"}
                                </p>
                              </div>
                            </div>

                            <Badge className={badgeByAssignment(b.assignedPartnerId ? b.assignmentStatus : "Unassigned")}>
                              {b.assignedPartnerId
                                ? b.assignmentStatus || "Assigned"
                                : "Unassigned"}
                            </Badge>
                          </div>

                          {b.assignedPartnerId ? (
                            <>
                              <div className="mt-4 space-y-2 text-sm text-slate-600">
                                {b.assignedPartnerEmail ? (
                                  <div className="flex items-center gap-2">
                                    <Mail size={14} />
                                    <span>{b.assignedPartnerEmail}</span>
                                  </div>
                                ) : null}

                                {b.assignedPartnerPhone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} />
                                    <span>{b.assignedPartnerPhone}</span>
                                  </div>
                                ) : null}

                                {b.assignedAt ? (
                                  <div className="flex items-center gap-2">
                                    <Clock3 size={14} />
                                    <span>Assigned: {fmtDateTime(b.assignedAt)}</span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {b.assignmentMethod ? (
                                  <Badge className="bg-white text-slate-700 border-slate-200">
                                    {b.assignmentMethod}
                                  </Badge>
                                ) : null}

                                {b.partnerResponseStatus ? (
                                  <Badge className="bg-white text-slate-700 border-slate-200">
                                    Response: {b.partnerResponseStatus}
                                  </Badge>
                                ) : null}
                              </div>
                            </>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No partner assigned yet for this booking.
                            </p>
                          )}

                          <button
                            onClick={() => openAssignModal(b)}
                            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-extrabold border ${
                              b.assignedPartnerId
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            <Users size={16} />
                            {b.assignedPartnerId ? "Reassign Partner" : "Assign Partner"}
                          </button>
                        </div>
                      </td>

                      <td className="p-4 w-[190px]">
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Amount
                            </div>
                            <div className="mt-2">
                              <Badge className="bg-slate-50 text-slate-900 border-slate-200">
                                <IndianRupee size={14} />
                                {fmtMoney(b.amount)}
                              </Badge>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Payment
                            </div>
                            <div className="font-extrabold text-slate-900 mt-2">
                              <SafeText value={b.paymentMethod} />
                            </div>
                            <div className="mt-2">
                              <Badge className={badgeByPayment(b.paymentStatus)}>
                                {b.paymentStatus || "—"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 w-[220px]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                            Update Status
                          </div>
                          <select
                            className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 font-extrabold bg-white ${
                              isUpdating ? "opacity-60" : ""
                            }`}
                            value={b.bookingStatus}
                            disabled={isUpdating}
                            onChange={(e) => onChangeStatus(b._id, e.target.value)}
                          >
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Completed</option>
                            <option>Cancelled</option>
                          </select>

                          <div className="mt-3">
                            <Badge className={badgeByStatus(b.bookingStatus)}>
                              {b.bookingStatus}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right w-[140px]">
                        <button
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-extrabold text-red-700 hover:bg-red-100"
                          onClick={() => onDelete(b._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="p-10 text-center text-slate-500" colSpan={7}>
                      No bookings found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tablet + mobile card layout */}
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:hidden">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="mt-3 h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="mt-5 h-10 bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-600 xl:col-span-2">
              No bookings found
            </div>
          ) : (
            items.map((b) => {
              const isUpdating = updatingId === b._id;

              return (
                <div
                  key={b._id}
                  className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <User size={18} className="text-slate-500" />
                        <SafeText value={b.customerName} />
                      </p>
                      <p className="text-sm text-slate-600 mt-1">{b.customerEmail || "-"}</p>
                      {b.phone ? <p className="text-sm text-slate-600">{b.phone}</p> : null}
                    </div>

                    <Badge className={badgeByStatus(b.bookingStatus)}>
                      {b.bookingStatus}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <SectionLabel icon={Package} title="Service Details" />

                      <p className="font-extrabold text-slate-900">{b.serviceTitle || "-"}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {b.packageName || "-"} • {fmtMoney(b.amount)}
                      </p>

                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-500" />
                          <span className="font-semibold">{fmtDate(b?.slot?.date)}</span>
                        </div>

                        <span className="hidden sm:inline text-slate-400">•</span>

                        <div className="flex items-center gap-2">
                          <Clock3 size={15} className="text-slate-500" />
                          <span>{b?.slot?.time || "-"}</span>
                        </div>
                      </div>

                      {b?.address?.line1 ? (
                        <div className="mt-3 text-sm text-slate-600 flex items-start gap-2">
                          <MapPin size={16} className="text-slate-500 mt-0.5" />
                          <span>
                            {b.address.line1}
                            {b.address.city ? `, ${b.address.city}` : ""}
                            {b.address.pincode ? ` - ${b.address.pincode}` : ""}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <SectionLabel icon={UserCheck} title="Partner Assignment" />

                      {b.assignedPartnerId ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">
                                {b.assignedPartnerName || "Assigned Partner"}
                              </p>

                              {b.assignedPartnerEmail ? (
                                <p className="text-sm text-slate-600 mt-1">
                                  {b.assignedPartnerEmail}
                                </p>
                              ) : null}

                              {b.assignedPartnerPhone ? (
                                <p className="text-sm text-slate-600">
                                  {b.assignedPartnerPhone}
                                </p>
                              ) : null}
                            </div>

                            <Badge className={badgeByAssignment(b.assignmentStatus)}>
                              {b.assignmentStatus || "Assigned"}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {b.assignmentMethod ? (
                              <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                                {b.assignmentMethod}
                              </Badge>
                            ) : null}

                            {b.partnerResponseStatus ? (
                              <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                                Response: {b.partnerResponseStatus}
                              </Badge>
                            ) : null}
                          </div>

                          {b.assignedAt ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                              <Clock3 size={14} />
                              <span>{fmtDateTime(b.assignedAt)}</span>
                            </div>
                          ) : null}

                          <button
                            onClick={() => openAssignModal(b)}
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-extrabold text-indigo-700 hover:bg-indigo-100"
                          >
                            <Users size={18} />
                            Reassign Partner
                          </button>
                        </>
                      ) : (
                        <>
                          <Badge className={badgeByAssignment("Unassigned")}>
                            Unassigned
                          </Badge>
                          <p className="mt-2 text-sm text-slate-500">
                            No partner assigned yet
                          </p>

                          <button
                            onClick={() => openAssignModal(b)}
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 font-extrabold text-blue-700 hover:bg-blue-100"
                          >
                            <Users size={18} />
                            Assign Partner
                          </button>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <SectionLabel icon={Wallet} title="Payment" />
                        <p className="text-sm font-bold text-slate-500">Method</p>
                        <p className="font-extrabold text-slate-900 mt-1">{b.paymentMethod || "-"}</p>

                        <div className="mt-3">
                          <Badge className={badgeByPayment(b.paymentStatus)}>
                            {b.paymentStatus || "—"}
                          </Badge>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <SectionLabel icon={BadgeCheck} title="Booking Status" />

                        <select
                          className={`w-full border border-slate-200 rounded-2xl px-3 py-2.5 font-extrabold ${
                            isUpdating ? "opacity-60" : ""
                          }`}
                          value={b.bookingStatus}
                          disabled={isUpdating}
                          onChange={(e) => onChangeStatus(b._id, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>

                        <div className="mt-3">
                          <Badge className={badgeByStatus(b.bookingStatus)}>
                            {b.bookingStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(b._id)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-extrabold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                    Delete Booking
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assignOpen && assignBooking ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-[30px] bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {assignBooking.assignedPartnerId ? "Reassign Partner" : "Assign Partner"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {assignBooking.customerName} • {assignBooking.serviceTitle}
                </p>
              </div>

              <button
                onClick={closeAssignModal}
                className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Customer
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {assignBooking.customerName || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Service
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {assignBooking.serviceTitle || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Category
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {assignBooking.serviceCategory || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Slot
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {fmtDate(assignBooking?.slot?.date)} • {assignBooking?.slot?.time || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      City
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {assignBooking?.address?.city || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Pincode
                    </p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {assignBooking?.address?.pincode || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {partnersLoading ? (
                <div className="py-14 text-center text-slate-500 font-semibold">
                  Loading partners...
                </div>
              ) : partnerOptions.length === 0 ? (
                <div className="py-14 text-center text-slate-500 rounded-3xl border border-dashed border-slate-300">
                  No matching partners found for this booking.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {partnerOptions.map((p) => {
                    const active = assigningPartnerId === p._id;

                    return (
                      <button
                        key={p._id}
                        onClick={() => setAssigningPartnerId(p._id)}
                        className={`w-full text-left rounded-3xl border p-4 sm:p-5 transition-all ${
                          active
                            ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-slate-900 text-base">
                              {p.name || "Partner"}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">{p.email || "-"}</div>
                            {p.phone ? (
                              <div className="text-sm text-slate-600">{p.phone}</div>
                            ) : null}
                            {p.city ? (
                              <div className="text-sm text-slate-600 mt-1">{p.city}</div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200">
                              Priority: {p.priority || 0}
                            </span>

                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200">
                              Max/Day: {p.maxBookingsPerDay || 5}
                            </span>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                p.isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {p.isAvailable ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-600">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <span className="font-bold text-slate-700">Categories:</span>{" "}
                            {(p.serviceCategories || []).length
                              ? p.serviceCategories.join(", ")
                              : "-"}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <span className="font-bold text-slate-700">Cities:</span>{" "}
                            {(p.cities || []).length ? p.cities.join(", ") : "-"}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <span className="font-bold text-slate-700">Pincodes:</span>{" "}
                            {(p.pincodes || []).length ? p.pincodes.join(", ") : "-"}
                          </div>
                        </div>

                        {active ? (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-3 py-1.5 text-xs font-extrabold">
                            <CheckCircle2 size={14} />
                            Selected Partner
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-white">
              <button
                onClick={closeAssignModal}
                className="px-5 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                disabled={partnersLoading}
              >
                Cancel
              </button>

              <button
                onClick={onAssignPartner}
                disabled={partnersLoading || !assigningPartnerId}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 disabled:opacity-60"
              >
                {partnersLoading ? "Saving..." : "Assign Partner"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}