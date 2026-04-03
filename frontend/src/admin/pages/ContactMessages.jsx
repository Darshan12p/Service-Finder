import React, { useEffect, useMemo, useState } from "react";
import {
  adminDeleteContactMessageApi,
  adminGetContactMessagesApi,
  adminToggleContactMessageStatusApi,
} from "../../services/api";
import Swal from "sweetalert2";
import {
  Search,
  Trash2,
  CheckCircle2,
  Clock3,
  X,
  Copy,
  RefreshCw,
  Mail,
  Phone,
  User2,
  MessageSquareText,
  Eye,
  Inbox,
  Filter,
  Sparkles,
} from "lucide-react";

const cn = (...s) => s.filter(Boolean).join(" ");

function Chip({ tone = "gray", children }) {
  const map = {
    gray: "border-slate-200 bg-slate-100 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    blue: "border-cyan-200 bg-cyan-50 text-cyan-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        map[tone] || map.gray
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ title, value, icon, theme = "slate" }) {
  const styles = {
    slate: "from-slate-900 to-slate-700 text-white",
    indigo: "from-indigo-600 to-indigo-500 text-white",
    amber: "from-amber-500 to-orange-400 text-white",
    emerald: "from-emerald-600 to-emerald-500 text-white",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-gradient-to-br p-5 shadow-sm",
        styles[theme] || styles.slate
      )}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight">{value}</h3>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              View complete customer message details
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-slate-100 text-slate-500">
        <Inbox size={34} />
      </div>
      <h3 className="mt-5 text-xl font-extrabold text-slate-900">No messages found</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        No contact messages match the current search or filter. Try changing the
        filter or search text.
      </p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-200">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid animate-pulse grid-cols-12 gap-4 p-4">
          <div className="col-span-3 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="col-span-3 space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
          <div className="col-span-3 space-y-2">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="col-span-3 flex items-center justify-end gap-2">
            <div className="h-9 w-24 rounded-2xl bg-slate-200" />
            <div className="h-9 w-24 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContactMessages() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [loading, setLoading] = useState(false);

  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState({ type: "info", msg: "" });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const showNote = (type, msg) => {
    setNote({ type, msg });
    window.clearTimeout(window.__contact_note_to__);
    window.__contact_note_to__ = window.setTimeout(() => {
      setNote({ type: "info", msg: "" });
    }, 2200);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetContactMessagesApi({
        status,
        search: searchDebounced,
      });
      setItems(res?.data?.items || []);
    } catch (e) {
      console.log(e);
      setItems([]);
      showNote("error", e?.response?.data?.message || "Failed to load messages");
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
    const pending = items.filter((x) => x.status !== "resolved").length;
    const resolved = items.filter((x) => x.status === "resolved").length;

    return { total, pending, resolved };
  }, [items]);

  const toggle = async (id) => {
    try {
      setBusyId(id);
      await adminToggleContactMessageStatusApi(id);
      showNote("success", "Status updated successfully");
      load();
    } catch (e) {
      showNote("error", e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId("");
    }
  };

  const del = async (id) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This contact message will be permanently deleted.",
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
      setBusyId(id);

      Swal.fire({
        title: "Deleting...",
        text: "Please wait",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      await adminDeleteContactMessageApi(id);
      Swal.close();

      await Swal.fire({
        title: "Deleted!",
        text: "Message deleted successfully.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
        timer: 1400,
        showConfirmButton: false,
      });

      showNote("success", "Message deleted");
      load();
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

  const copy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showNote("success", "Copied to clipboard");
    } catch {
      showNote("error", "Copy failed");
    }
  };

  const noteTone =
    note.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : note.type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* top section */}
      <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700">
              <Sparkles size={14} />
              Admin message center
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Contact Messages
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage customer contact requests, review message details, mark
              them resolved, and delete irrelevant entries from one place.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:w-[320px]">
              <Search size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              <Filter size={18} className="text-slate-400" />
              <select
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All Messages</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Messages"
            value={stats.total}
            icon={<MessageSquareText size={22} />}
            theme="slate"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock3 size={22} />}
            theme="amber"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 size={22} />}
            theme="emerald"
          />
        </div>

        {note.msg ? (
          <div
            className={cn(
              "mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold",
              noteTone
            )}
          >
            {note.msg}
          </div>
        ) : null}
      </div>

      {/* desktop table */}
      <div className="mt-6 hidden overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm lg:block">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">All Messages</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading messages..." : `${items.length} message(s) found`}
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Message</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {items.map((m, idx) => {
                  const isResolved = m.status === "resolved";
                  const rowBusy = busyId === m._id;

                  return (
                    <tr
                      key={m._id}
                      className={cn(
                        "transition hover:bg-indigo-50/40",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      )}
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                            <User2 size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleString()
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Mail size={13} />
                                EMAIL
                              </div>
                              <p className="truncate text-sm font-medium text-slate-800">
                                {m.email || "-"}
                              </p>
                            </div>
                            {m.email ? (
                              <button
                                onClick={() => copy(m.email)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="Copy email"
                              >
                                <Copy size={14} />
                              </button>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Phone size={13} />
                                PHONE
                              </div>
                              <p className="truncate text-sm font-medium text-slate-800">
                                {m.mobile || "-"}
                              </p>
                            </div>
                            {m.mobile ? (
                              <button
                                onClick={() => copy(m.mobile)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="Copy phone"
                              >
                                <Copy size={14} />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="max-w-xl px-5 py-4 align-top">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="line-clamp-3 text-sm leading-6 text-slate-700">
                            {m.description || "-"}
                          </p>
                          <button
                            onClick={() => {
                              setViewItem(m);
                              setViewOpen(true);
                            }}
                            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
                          >
                            <Eye size={15} />
                            View full message
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <button
                          disabled={rowBusy}
                          onClick={() => toggle(m._id)}
                          className="disabled:cursor-not-allowed disabled:opacity-60"
                          title="Toggle status"
                        >
                          {isResolved ? (
                            <Chip tone="green">
                              <CheckCircle2 size={14} />
                              Resolved
                            </Chip>
                          ) : (
                            <Chip tone="amber">
                              <Clock3 size={14} />
                              Pending
                            </Chip>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewItem(m);
                              setViewOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          <button
                            disabled={rowBusy}
                            onClick={() => del(m._id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* mobile cards */}
      <div className="mt-6 grid gap-4 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
              <div className="mt-4 h-20 rounded-2xl bg-slate-100" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <EmptyState />
          </div>
        ) : (
          items.map((m) => {
            const isResolved = m.status === "resolved";
            const rowBusy = busyId === m._id;

            return (
              <div
                key={m._id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <User2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {m.firstName} {m.lastName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : "-"}
                      </p>
                    </div>
                  </div>

                  {isResolved ? (
                    <Chip tone="green">
                      <CheckCircle2 size={14} />
                      Resolved
                    </Chip>
                  ) : (
                    <Chip tone="amber">
                      <Clock3 size={14} />
                      Pending
                    </Chip>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Mail size={13} />
                          EMAIL
                        </p>
                        <p className="truncate text-sm font-medium text-slate-800">
                          {m.email || "-"}
                        </p>
                      </div>
                      {m.email ? (
                        <button
                          onClick={() => copy(m.email)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white"
                        >
                          <Copy size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Phone size={13} />
                          PHONE
                        </p>
                        <p className="truncate text-sm font-medium text-slate-800">
                          {m.mobile || "-"}
                        </p>
                      </div>
                      {m.mobile ? (
                        <button
                          onClick={() => copy(m.mobile)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white"
                        >
                          <Copy size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <MessageSquareText size={13} />
                      MESSAGE
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                      {m.description || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setViewItem(m);
                      setViewOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    disabled={rowBusy}
                    onClick={() => toggle(m._id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-white transition disabled:opacity-60",
                      isResolved
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-amber-500 hover:bg-amber-600"
                    )}
                  >
                    {isResolved ? (
                      <>
                        <CheckCircle2 size={15} />
                        Resolved
                      </>
                    ) : (
                      <>
                        <Clock3 size={15} />
                        Pending
                      </>
                    )}
                  </button>
                </div>

                <button
                  disabled={rowBusy}
                  onClick={() => del(m._id)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  Delete Message
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* modal */}
      <Modal
        open={viewOpen}
        title="Customer Message"
        onClose={() => {
          setViewOpen(false);
          setViewItem(null);
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                if (viewItem?.email) copy(viewItem.email);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-white"
            >
              <Copy size={15} />
              Copy Email
            </button>

            <button
              onClick={() => {
                setViewOpen(false);
                setViewItem(null);
              }}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Full Name
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {viewItem?.firstName} {viewItem?.lastName}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Created At
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {viewItem?.createdAt
                  ? new Date(viewItem.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {viewItem?.email || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Phone
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {viewItem?.mobile || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Full Message
            </p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {viewItem?.description || "-"}
            </div>
          </div>

          <div>
            {viewItem?.status === "resolved" ? (
              <Chip tone="green">
                <CheckCircle2 size={14} />
                Resolved
              </Chip>
            ) : (
              <Chip tone="amber">
                <Clock3 size={14} />
                Pending
              </Chip>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}