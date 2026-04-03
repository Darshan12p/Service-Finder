import React, { useEffect, useMemo, useState } from "react";
import {
  adminDeleteJoinInquiryApi,
  adminGetJoinInquiriesApi,
  adminUpdateJoinInquiryStatusApi,
} from "../../services/api";
import {
  Search,
  Trash2,
  FileText,
  Copy,
  X,
  MapPin,
  UserCheck,
  Clock3,
  BadgeInfo,
  PhoneCall,
  RefreshCcw,
  Briefcase,
  CheckCircle2,
  XCircle,
  Hourglass,
  Mail,
  CalendarDays,
  Sparkles,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";

const FILE_BASE = "http://localhost:5000";

const cn = (...s) => s.filter(Boolean).join(" ");

function Chip({ tone = "gray", children }) {
  const map = {
    gray: "border-slate-200 bg-slate-100 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm",
        map[tone] || map.gray
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ title, value, icon, tone = "indigo" }) {
  const toneMap = {
    indigo:
      "from-indigo-500/10 to-indigo-100/40 border-indigo-100 text-indigo-600",
    amber:
      "from-amber-500/10 to-amber-100/40 border-amber-100 text-amber-600",
    green:
      "from-emerald-500/10 to-emerald-100/40 border-emerald-100 text-emerald-600",
    red: "from-rose-500/10 to-rose-100/40 border-rose-100 text-rose-600",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        toneMap[tone]
      )}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 px-6 py-5">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              View complete inquiry profile and review notes
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto bg-slate-50/60 p-6">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-slate-200 bg-white px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, icon = null }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            {icon}
          </div>
        ) : null}

        <div>
          <div className="text-sm font-extrabold tracking-wide text-slate-900">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-200 py-2 last:border-b-0 last:pb-0">
      <div className="min-w-[120px] text-sm font-semibold text-slate-500">
        {label}
      </div>
      <div className="text-right text-sm font-medium text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}

export default function JoinInquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [note, setNote] = useState({ type: "info", msg: "" });
  const [busyId, setBusyId] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const showNote = (type, msg) => {
    setNote({ type, msg });
    window.clearTimeout(window.__ji_note_to);
    window.__ji_note_to = window.setTimeout(
      () => setNote({ type: "info", msg: "" }),
      2200
    );
  };

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 450);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetJoinInquiriesApi({
        status,
        search: searchDebounced,
      });
      setItems(res?.data?.items || []);
    } catch (e) {
      showNote(
        "error",
        e?.response?.data?.message || "Failed to load inquiries"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [status, searchDebounced]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(
      (x) => (x.status || "pending") === "pending"
    ).length;
    const approved = items.filter((x) => x.status === "approved").length;
    const rejected = items.filter((x) => x.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [items]);

  const docUrl = (it) => {
    if (!it?.documentUrl) return "";
    if (it.documentUrl.startsWith("http")) return it.documentUrl;
    return `${FILE_BASE}${it.documentUrl}`;
  };

  const statusTone = (s) => {
    if (s === "approved") return "green";
    if (s === "rejected") return "red";
    return "amber";
  };

  const noteTone =
    note.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : note.type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-white text-slate-700";

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showNote("success", "Copied");
    } catch {
      showNote("error", "Copy failed");
    }
  };

  const getServiceNames = (it) => {
    if (Array.isArray(it?.serviceIds) && it.serviceIds.length) {
      return it.serviceIds
        .map((s) =>
          typeof s === "object"
            ? s?.title || s?.category?.name || s?.category || ""
            : String(s || "").trim()
        )
        .filter(Boolean);
    }

    if (
      Array.isArray(it?.serviceCategoryNames) &&
      it.serviceCategoryNames.length
    ) {
      return it.serviceCategoryNames.filter(Boolean);
    }

    return [];
  };

  const getActiveSlots = (it) => {
    return Array.isArray(it?.workingSlots)
      ? it.workingSlots.filter((slot) => slot?.isAvailable)
      : [];
  };

  const askReasonAndUpdateStatus = async (it, newStatus) => {
    const currentStatus = it?.status || "pending";
    if (currentStatus === newStatus) return;

    if (newStatus === "approved") {
      const { value: formValues, isConfirmed } = await Swal.fire({
        title: "Approve inquiry?",
        html: `
          <div style="text-align:left; margin-top:10px;">
            <label style="display:block; font-size:14px; font-weight:600; margin-bottom:6px;">
              Approval note (optional)
            </label>
            <textarea id="approvalNotes" class="swal2-textarea" placeholder="Write any note for this approval..." style="display:block;"></textarea>

            <label style="display:flex; align-items:center; gap:10px; margin-top:16px; font-size:14px; font-weight:600;">
              <input id="allowDirectCustomerContact" type="checkbox" checked />
              Allow direct customer contact
            </label>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Approve",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#16a34a",
        focusConfirm: false,
        preConfirm: () => {
          const approvalNotes =
            document.getElementById("approvalNotes")?.value || "";
          const allowDirectCustomerContact = !!document.getElementById(
            "allowDirectCustomerContact"
          )?.checked;

          return { approvalNotes, allowDirectCustomerContact };
        },
      });

      if (!isConfirmed) return;

      try {
        setBusyId(it._id);
        await adminUpdateJoinInquiryStatusApi(it._id, {
          status: "approved",
          approvalNotes: formValues?.approvalNotes || "",
          allowDirectCustomerContact:
            formValues?.allowDirectCustomerContact !== false,
        });
        showNote("success", "Inquiry approved successfully");
        await load();
      } catch (e) {
        showNote(
          "error",
          e?.response?.data?.message || "Failed to update status"
        );
      } finally {
        setBusyId("");
      }

      return;
    }

    if (newStatus === "rejected") {
      const result = await Swal.fire({
        title: "Reject inquiry?",
        input: "textarea",
        inputLabel: "Rejection reason",
        inputPlaceholder: "Write the rejection reason...",
        inputAttributes: { "aria-label": "Rejection reason" },
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
        preConfirm: (value) => {
          if (!String(value || "").trim()) {
            Swal.showValidationMessage("Rejection reason is required");
            return false;
          }
          return value;
        },
      });

      if (!result.isConfirmed) return;

      try {
        setBusyId(it._id);
        await adminUpdateJoinInquiryStatusApi(it._id, {
          status: "rejected",
          rejectionReason: result.value || "",
        });
        showNote("success", "Inquiry rejected successfully");
        await load();
      } catch (e) {
        showNote(
          "error",
          e?.response?.data?.message || "Failed to update status"
        );
      } finally {
        setBusyId("");
      }

      return;
    }
  };

  const del = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This inquiry will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setBusyId(id);

      await Swal.fire({
        title: "Deleting...",
        text: "Please wait",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await adminDeleteJoinInquiryApi(id);

      Swal.close();

      await Swal.fire({
        title: "Deleted!",
        text: "Inquiry has been deleted successfully.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
        timer: 1500,
        showConfirmButton: false,
      });

      showNote("success", "Inquiry deleted");
      await load();
    } catch (e) {
      Swal.close();
      Swal.fire({
        title: "Error",
        text: e?.response?.data?.message || "Failed to delete",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
      showNote("error", e?.response?.data?.message || "Failed to delete");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur md:p-8">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
                <Sparkles size={14} />
                Premium Partner Review Panel
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Join Inquiries
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review candidate applications, inspect professional details,
                verify service coverage, and approve or reject applicants with a
                polished admin workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search size={18} className="text-slate-400" />
                <input
                  className="w-full min-w-[220px] bg-transparent text-sm outline-none lg:min-w-[320px]"
                  placeholder="Search name / email / phone / service / city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={load}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Inquiries"
              value={stats.total}
              tone="indigo"
              icon={<Briefcase size={22} />}
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              tone="amber"
              icon={<Hourglass size={22} />}
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              tone="green"
              icon={<CheckCircle2 size={22} />}
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              tone="red"
              icon={<XCircle size={22} />}
            />
          </div>

          {note.msg ? (
            <div
              className={cn(
                "mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm",
                noteTone
              )}
            >
              {note.msg}
            </div>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Candidate Applications
              </h2>
              <p className="text-sm text-slate-500">
                {loading ? "Loading inquiries..." : `${items.length} records`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Candidate</th>
                  <th className="px-5 py-4">Professional</th>
                  <th className="px-5 py-4">Services & Area</th>
                  <th className="px-5 py-4">Document</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-500">
                          <Briefcase size={28} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">
                          No inquiries found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing search text or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {items.map((it, idx) => {
                  const docLink = docUrl(it);
                  const s = it.status || "pending";
                  const rowBusy = busyId === it._id;
                  const serviceNames = getServiceNames(it);
                  const activeSlots = getActiveSlots(it);

                  return (
                    <tr
                      key={it._id}
                      className={cn(
                        "border-t border-slate-200 align-top transition hover:bg-indigo-50/30",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      )}
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black text-white shadow-md">
                            {(it.fullName || "U").charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-black text-slate-900">
                              {it.fullName || "-"}
                            </div>

                            <div className="mt-2 space-y-2 text-xs text-slate-600">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <Mail size={13} className="text-slate-400" />
                                  <span className="truncate">{it.email || "-"}</span>
                                </div>
                                {it.email ? (
                                  <button
                                    onClick={() => copy(it.email)}
                                    className="rounded-xl border border-slate-200 p-2 transition hover:bg-white"
                                    title="Copy email"
                                  >
                                    <Copy size={14} />
                                  </button>
                                ) : null}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <PhoneCall size={13} className="text-slate-400" />
                                  <span>{it.phone || "-"}</span>
                                </div>
                                {it.phone ? (
                                  <button
                                    onClick={() => copy(it.phone)}
                                    className="rounded-xl border border-slate-200 p-2 transition hover:bg-white"
                                    title="Copy phone"
                                  >
                                    <Copy size={14} />
                                  </button>
                                ) : null}
                              </div>

                              <div>Gender: {it.gender || "-"}</div>
                              <div>DOB: {it.dob || "-"}</div>
                              <div>
                                User: {it.userId?.profile?.name || "-"} /{" "}
                                {it.userId?.role || "-"}
                              </div>
                            </div>

                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                              <CalendarDays size={12} />
                              {it.createdAt
                                ? new Date(it.createdAt).toLocaleString()
                                : "-"}
                            </div>

                            <button
                              onClick={() => {
                                setSelected(it);
                                setOpen(true);
                              }}
                              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              <Eye size={14} />
                              View full details
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-2 text-sm text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-500">
                              Degree:
                            </span>{" "}
                            {it.education?.degree || "-"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              Institute:
                            </span>{" "}
                            {it.education?.institute || "-"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              Experience:
                            </span>{" "}
                            {it.professional?.experienceYears ?? "-"} years
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              Role:
                            </span>{" "}
                            {it.professional?.currentRole || "-"}
                          </div>

                          {it.professional?.about ? (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                              {it.professional.about}
                            </div>
                          ) : null}

                          {Array.isArray(it.skills) && it.skills.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {it.skills.slice(0, 6).map((sk, i) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                                >
                                  {sk}
                                </span>
                              ))}
                              {it.skills.length > 6 ? (
                                <span className="self-center text-xs font-semibold text-slate-500">
                                  +{it.skills.length - 6} more
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-4">
                          <div>
                            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                              Services
                            </div>
                            {serviceNames.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {serviceNames.slice(0, 4).map((name, i) => (
                                  <span
                                    key={`${name}-${i}`}
                                    className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                                  >
                                    {name}
                                  </span>
                                ))}
                                {serviceNames.length > 4 ? (
                                  <span className="self-center text-xs font-semibold text-slate-500">
                                    +{serviceNames.length - 4} more
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>

                          <div>
                            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                              Area
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                              <div>City: {it.city || "-"}</div>
                              <div className="mt-1">Pincode: {it.pincode || "-"}</div>
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                              Available Days
                            </div>
                            {activeSlots.length ? (
                              <div className="space-y-1.5">
                                {activeSlots.slice(0, 2).map((slot, i) => (
                                  <div
                                    key={`${slot.day}-${i}`}
                                    className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                                  >
                                    {slot.day}: {slot.startTime} - {slot.endTime}
                                  </div>
                                ))}
                                {activeSlots.length > 2 ? (
                                  <div className="text-xs font-semibold text-slate-500">
                                    +{activeSlots.length - 2} more days
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        {docLink ? (
                          <a
                            href={docLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <FileText size={16} />
                            View File
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No file</span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-3">
                          <div>
                            <Chip tone={statusTone(s)}>
                              {s === "approved"
                                ? "Approved"
                                : s === "rejected"
                                ? "Rejected"
                                : "Pending"}
                            </Chip>
                          </div>

                          <select
                            disabled={rowBusy}
                            className={cn(
                              "w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none transition disabled:opacity-60",
                              s === "approved"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : s === "rejected"
                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            )}
                            value={s}
                            onChange={(e) =>
                              askReasonAndUpdateStatus(it, e.target.value)
                            }
                          >
                            <option value="pending" disabled>
                              Pending
                            </option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          {it.approvalNotes ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                              Note: {it.approvalNotes}
                            </div>
                          ) : null}

                          {it.rejectionReason ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                              Reason: {it.rejectionReason}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={rowBusy}
                            onClick={() => {
                              setSelected(it);
                              setOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            <Eye size={16} />
                            Details
                          </button>

                          <button
                            disabled={rowBusy}
                            onClick={() => del(it._id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td colSpan={6} className="px-5 py-5">
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        title="Inquiry Details"
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        footer={
          <button
            onClick={() => {
              setOpen(false);
              setSelected(null);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        }
      >
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/20 text-2xl font-black backdrop-blur">
                  {(selected?.fullName || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-2xl font-black">{selected?.fullName || "-"}</div>
                  <div className="mt-1 text-sm text-white/85">
                    {selected?.email || "-"} • {selected?.phone || "-"}
                  </div>
                  <div className="mt-3">
                    <Chip tone="indigo">{selected?.status || "pending"}</Chip>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                Applied on:{" "}
                {selected?.createdAt
                  ? new Date(selected.createdAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SectionCard
              title="Candidate Information"
              subtitle="Basic candidate profile"
              icon={<UserCheck size={18} />}
            >
              <div className="space-y-1">
                <InfoRow label="Full Name" value={selected?.fullName} />
                <InfoRow label="Email" value={selected?.email} />
                <InfoRow label="Phone" value={selected?.phone} />
                <InfoRow label="Gender" value={selected?.gender} />
                <InfoRow label="DOB" value={selected?.dob} />
                <InfoRow label="User Role" value={selected?.userId?.role} />
                <InfoRow
                  label="User Name"
                  value={selected?.userId?.profile?.name}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Education"
              subtitle="Academic profile"
              icon={<BadgeInfo size={18} />}
            >
              <div className="space-y-1">
                <InfoRow label="Degree" value={selected?.education?.degree} />
                <InfoRow
                  label="Institute"
                  value={selected?.education?.institute}
                />
                <InfoRow
                  label="Passing Year"
                  value={selected?.education?.passingYear}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Professional"
              subtitle="Work details"
              icon={<Briefcase size={18} />}
            >
              <div className="space-y-1">
                <InfoRow
                  label="Experience"
                  value={selected?.professional?.experienceYears}
                />
                <InfoRow
                  label="Current Role"
                  value={selected?.professional?.currentRole}
                />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {selected?.professional?.about || "-"}
              </div>
            </SectionCard>

            <SectionCard
              title="Service Area"
              subtitle="Location coverage"
              icon={<MapPin size={18} />}
            >
              <div className="space-y-1">
                <InfoRow label="City" value={selected?.city} />
                <InfoRow label="Pincode" value={selected?.pincode} />
                <InfoRow label="Address" value={selected?.addressLine1} />
              </div>
            </SectionCard>

            <SectionCard
              title="Selected Services"
              subtitle="Preferred service categories"
              icon={<BadgeInfo size={18} />}
            >
              {getServiceNames(selected).length ? (
                <div className="flex flex-wrap gap-2">
                  {getServiceNames(selected).map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">-</div>
              )}
            </SectionCard>

            <SectionCard
              title="Working Availability"
              subtitle="Available time slots"
              icon={<Clock3 size={18} />}
            >
              {getActiveSlots(selected).length ? (
                <div className="space-y-2">
                  {getActiveSlots(selected).map((slot, i) => (
                    <div
                      key={`${slot.day}-${i}`}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
                    >
                      {slot.day}: {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No working slots selected
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Skills"
            subtitle="Candidate skills"
            icon={<Sparkles size={18} />}
          >
            {Array.isArray(selected?.skills) && selected.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {selected.skills.map((sk, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">-</div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SectionCard
              title="Review Info"
              subtitle="Approval or rejection metadata"
              icon={<BadgeInfo size={18} />}
            >
              <div className="space-y-1">
                <InfoRow label="Status" value={selected?.status} />
                <InfoRow
                  label="Reviewed By"
                  value={
                    selected?.reviewedBy?.profile?.name ||
                    selected?.reviewedBy?.email
                  }
                />
                <InfoRow
                  label="Reviewed At"
                  value={
                    selected?.reviewedAt
                      ? new Date(selected.reviewedAt).toLocaleString()
                      : "-"
                  }
                />
                <InfoRow
                  label="Approved User"
                  value={
                    selected?.approvedUserId?.profile?.name ||
                    selected?.approvedUserId?.email
                  }
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Review Notes"
              subtitle="Reasoning and notes"
              icon={<FileText size={18} />}
            >
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Approval Notes
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                    {selected?.approvalNotes || "-"}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Rejection Reason
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    {selected?.rejectionReason || "-"}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {selected?.status === "approved" ? (
            <SectionCard
              title="Partner Activation"
              subtitle="Approved candidate system info"
              icon={<PhoneCall size={18} />}
            >
              <div className="space-y-3 text-sm text-slate-800">
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  <PhoneCall size={16} className="mt-0.5 shrink-0" />
                  <span>
                    After approval, this user becomes a service partner and can
                    be auto-assigned to matching bookings.
                  </span>
                </div>
                <InfoRow
                  label="Approved User ID"
                  value={selected?.approvedUserId?._id}
                />
              </div>
            </SectionCard>
          ) : null}

          {docUrl(selected) ? (
            <a
              href={docUrl(selected)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              <FileText size={17} />
              View Document
            </a>
          ) : null}
        </div>
      </Modal>

      {note.msg ? (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[90] rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl",
            noteTone
          )}
        >
          {note.msg}
        </div>
      ) : null}
    </div>
  );
}