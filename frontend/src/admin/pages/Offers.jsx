import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Power,
  ListChecks,
  X,
  Tag,
  BadgePercent,
  IndianRupee,
  SlidersHorizontal,
  CheckCheck,
  Sparkles,
  Layers3,
  TicketPercent,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import {
  adminGetOffersApi,
  adminCreateOfferApi,
  adminToggleOfferApi,
  adminDeleteOfferApi,
  adminAssignOfferServicesApi,
  getServicesApi,
} from "../../services/api";

const DEFAULT_FORM = {
  title: "",
  code: "",
  discountType: "percent",
  value: 10,
  isActive: true,
};

const cn = (...s) => s.filter(Boolean).join(" ");

function Chip({ children, tone = "gray", className = "" }) {
  const map = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
        map[tone] || map.gray,
        className
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "indigo" }) {
  const toneMap = {
    indigo: "from-indigo-500 to-violet-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    sky: "from-sky-500 to-cyan-500",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
      <div
        className={cn(
          "absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br opacity-10",
          toneMap[tone] || toneMap.indigo
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {value}
          </p>
          {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
        </div>

        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
            toneMap[tone] || toneMap.indigo
          )}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function ModalShell({ title, desc, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-5">
      <div
        className={cn(
          "max-h-[92vh] w-full overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl",
          wide ? "max-w-6xl" : "max-w-3xl"
        )}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-gray-900">
                {title}
              </h2>
              {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-148px)] overflow-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-gray-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ title, desc, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-indigo-600">
        <TicketPercent size={28} />
      </div>
      <h3 className="text-lg font-black text-gray-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">{desc}</p>
      {actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          {actionText}
        </button>
      ) : null}
    </div>
  );
}

function OfferRowSkeleton() {
  return (
    <div className="grid grid-cols-12 items-center border-t border-gray-100 px-4 py-4">
      <div className="col-span-12 mb-3 flex items-center gap-3 md:col-span-4 md:mb-0">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="col-span-4 md:col-span-2">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-4 md:col-span-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="col-span-4 md:col-span-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-6 mt-3 md:col-span-1 md:mt-0">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="col-span-6 mt-3 flex justify-end gap-2 md:col-span-1 md:mt-0">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignOffer, setAssignOffer] = useState(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceQ, setServiceQ] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [note, setNote] = useState({ type: "info", msg: "" });

  const showNote = (type, msg) => {
    setNote({ type, msg });
    window.clearTimeout(window.__offers_note_to__);
    window.__offers_note_to__ = window.setTimeout(() => {
      setNote({ type: "info", msg: "" });
    }, 2600);
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      const [oRes, sRes] = await Promise.all([
        adminGetOffersApi(),
        getServicesApi({ page: 1, limit: 500 }),
      ]);

      setOffers(oRes?.data?.offers || []);

      const list = sRes?.data?.items || sRes?.data?.services || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setOffers([]);
      setServices([]);
      showNote("error", e?.response?.data?.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const total = offers.length;
    const active = offers.filter((o) => o.isActive).length;
    const inactive = total - active;
    const avg =
      total === 0
        ? 0
        : Math.round(
            offers.reduce((sum, o) => sum + Number(o.value || 0), 0) / total
          );

    return { total, active, inactive, avg };
  }, [offers]);

  const serviceNameById = (id) =>
    services.find((s) => s._id === id)?.title || "Service";

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    let list = [...offers];

    if (statusFilter === "active") list = list.filter((o) => o.isActive);
    if (statusFilter === "inactive") list = list.filter((o) => !o.isActive);

    if (search) {
      list = list.filter(
        (o) =>
          String(o.title || "")
            .toLowerCase()
            .includes(search) ||
          String(o.code || "")
            .toLowerCase()
            .includes(search)
      );
    }

    const safeDate = (d) => (d ? new Date(d).getTime() : 0);
    const discountScore = (o) => {
      const v = Number(o.value || 0);
      return o.discountType === "percent" ? v * 1000 : v;
    };

    list.sort((a, b) => {
      if (sortBy === "newest") return safeDate(b.createdAt) - safeDate(a.createdAt);
      if (sortBy === "oldest") return safeDate(a.createdAt) - safeDate(b.createdAt);
      if (sortBy === "title")
        return String(a.title || "").localeCompare(String(b.title || ""));
      if (sortBy === "discount") return discountScore(b) - discountScore(a);
      return 0;
    });

    return list;
  }, [offers, q, statusFilter, sortBy]);

  const filteredServices = useMemo(() => {
    const search = serviceQ.trim().toLowerCase();
    if (!search) return services;

    return services.filter(
      (s) =>
        String(s.title || "")
          .toLowerCase()
          .includes(search) ||
        String(s.categoryName || s.category || "")
          .toLowerCase()
          .includes(search)
    );
  }, [services, serviceQ]);

  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s._id));
  }, [services, selectedServiceIds]);

  const allVisibleSelected =
    filteredServices.length > 0 &&
    filteredServices.every((x) => selectedServiceIds.includes(x._id));

  const toggleSelectAllVisible = () => {
    const ids = filteredServices.map((x) => x._id);

    if (allVisibleSelected) {
      setSelectedServiceIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedServiceIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const resetCreateForm = () => {
    setForm(DEFAULT_FORM);
  };

  const createOffer = async () => {
    try {
      const title = form.title.trim();
      const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
      const value = Number(form.value);

      if (!title) return showNote("error", "Offer title is required");
      if (!code) return showNote("error", "Offer code is required");
      if (!value || value <= 0) return showNote("error", "Discount value must be greater than 0");

      if (form.discountType === "percent" && value > 100) {
        return showNote("error", "Percent discount cannot be more than 100");
      }

      setCreating(true);

      await adminCreateOfferApi({
        title,
        code,
        discountType: form.discountType,
        value,
        isActive: !!form.isActive,
      });

      setOpen(false);
      resetCreateForm();
      showNote("success", "Offer created successfully");
      loadAll();
    } catch (e) {
      console.error(e);
      showNote("error", e?.response?.data?.message || "Failed to create offer");
    } finally {
      setCreating(false);
    }
  };

  const toggleOffer = async (id) => {
    try {
      await adminToggleOfferApi(id);
      showNote("success", "Offer status updated");
      loadAll();
    } catch (e) {
      console.error(e);
      showNote("error", e?.response?.data?.message || "Failed to update offer");
    }
  };

  const deleteOffer = async (id) => {
    const ok = window.confirm("Delete this offer permanently?");
    if (!ok) return;

    try {
      await adminDeleteOfferApi(id);
      showNote("success", "Offer deleted");
      loadAll();
    } catch (e) {
      console.error(e);
      showNote("error", e?.response?.data?.message || "Failed to delete offer");
    }
  };

  const openAssign = (offer) => {
    setAssignOffer(offer);
    setSelectedServiceIds(offer?.serviceIds || []);
    setServiceQ("");
    setAssignOpen(true);
  };

  const saveAssign = async () => {
    try {
      if (!assignOffer?._id) return;
      setAssignLoading(true);

      await adminAssignOfferServicesApi(assignOffer._id, selectedServiceIds);

      showNote("success", "Offer services updated");
      setAssignOpen(false);
      setAssignOffer(null);
      setSelectedServiceIds([]);
      loadAll();
    } catch (e) {
      console.error(e);
      showNote("error", e?.response?.data?.message || "Failed to assign services");
    } finally {
      setAssignLoading(false);
    }
  };

  const noteTone =
    note.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : note.type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-gray-200 bg-gray-50 text-gray-800";

  const actionBtn =
    "grid h-10 w-10 place-items-center rounded-2xl border border-gray-200 bg-white " +
    "text-gray-700 transition hover:bg-gray-50";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-gray-50 to-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Sparkles size={14} />
            Premium Offer Management
          </div>

          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Offers Module
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Create smart offers, manage active status, and assign offers to
            services with a clean premium admin interface.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Offer
          </button>
        </div>
      </div>

      {/* Note */}
      {note.msg ? (
        <div className={cn("mb-5 rounded-2xl border px-4 py-3 text-sm font-bold", noteTone)}>
          {note.msg}
        </div>
      ) : null}

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Tag}
          label="Total Offers"
          value={stats.total}
          tone="indigo"
        />
        <StatCard
          icon={CheckCheck}
          label="Active Offers"
          value={stats.active}
          tone="emerald"
        />
        <StatCard
          icon={Power}
          label="Inactive Offers"
          value={stats.inactive}
          tone="amber"
        />
        <StatCard
          icon={BadgePercent}
          label="Average Value"
          value={stats.avg}
          sub="Simple average"
          tone="sky"
        />
      </div>

      {/* Controls */}
      <SectionCard className="mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Search size={18} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search offer title or code..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
                <SlidersHorizontal size={16} />
                Filters
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="all">All status</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A-Z</option>
                <option value="discount">Highest discount</option>
              </select>
            </div>
          </div>

          <div className="shrink-0 text-sm text-gray-500">
            Showing{" "}
            <span className="font-black text-gray-900">{filtered.length}</span>{" "}
            offers
          </div>
        </div>
      </SectionCard>

      {/* Desktop table */}
      <SectionCard className="hidden overflow-hidden lg:block">
        <div className="grid grid-cols-12 border-b border-gray-100 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-gray-500">
          <div className="col-span-4">Offer</div>
          <div className="col-span-2">Code</div>
          <div className="col-span-2">Discount</div>
          <div className="col-span-2">Assigned Services</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <>
            <OfferRowSkeleton />
            <OfferRowSkeleton />
            <OfferRowSkeleton />
            <OfferRowSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No offers found"
            desc="Try changing search, filter, or create a new offer to get started."
            actionText="Create Offer"
            onAction={() => setOpen(true)}
          />
        ) : (
          filtered.map((o, idx) => {
            const assignedNames = (o.serviceIds || []).slice(0, 2).map(serviceNameById);

            return (
              <div
                key={o._id}
                className={cn(
                  "grid grid-cols-12 items-center px-5 py-4 text-sm transition",
                  idx !== 0 && "border-t border-gray-100",
                  "hover:bg-indigo-50/40"
                )}
              >
                <div className="col-span-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gray-200 bg-slate-50">
                      {o.discountType === "fixed" ? (
                        <IndianRupee size={18} className="text-gray-700" />
                      ) : (
                        <BadgePercent size={18} className="text-gray-700" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-gray-900">
                        {o.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <CalendarClock size={13} />
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "No date"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs font-black text-slate-800">
                    {o.code}
                  </span>
                </div>

                <div className="col-span-2">
                  <Chip tone="indigo">
                    {o.discountType === "fixed" ? `₹${o.value}` : `${o.value}% OFF`}
                  </Chip>
                </div>

                <div className="col-span-2">
                  <div className="font-black text-gray-900">
                    {(o.serviceIds?.length || 0)} services
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500">
                    {assignedNames.join(", ")}
                    {(o.serviceIds || []).length > 2 ? " ..." : ""}
                  </div>
                </div>

                <div className="col-span-1">
                  {o.isActive ? (
                    <Chip tone="green">Active</Chip>
                  ) : (
                    <Chip tone="gray">Inactive</Chip>
                  )}
                </div>

                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openAssign(o)}
                    className={actionBtn}
                    title="Assign services"
                  >
                    <ListChecks size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOffer(o._id)}
                    className={actionBtn}
                    title="Toggle offer"
                  >
                    <Power size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteOffer(o._id)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                    title="Delete offer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          <>
            <SectionCard className="p-4"><OfferRowSkeleton /></SectionCard>
            <SectionCard className="p-4"><OfferRowSkeleton /></SectionCard>
          </>
        ) : filtered.length === 0 ? (
          <SectionCard>
            <EmptyState
              title="No offers found"
              desc="You don't have matching offers right now."
              actionText="Create Offer"
              onAction={() => setOpen(true)}
            />
          </SectionCard>
        ) : (
          filtered.map((o) => (
            <SectionCard key={o._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-slate-50">
                  {o.discountType === "fixed" ? (
                    <IndianRupee size={18} className="text-gray-700" />
                  ) : (
                    <BadgePercent size={18} className="text-gray-700" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-900">{o.title}</h3>
                      <p className="mt-1 text-xs text-gray-500">{o.code}</p>
                    </div>

                    {o.isActive ? (
                      <Chip tone="green">Active</Chip>
                    ) : (
                      <Chip tone="gray">Inactive</Chip>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Chip tone="indigo">
                      {o.discountType === "fixed" ? `₹${o.value}` : `${o.value}% OFF`}
                    </Chip>
                    <Chip tone="blue">{(o.serviceIds?.length || 0)} services</Chip>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    {(o.serviceIds || []).slice(0, 2).map(serviceNameById).join(", ")}
                    {(o.serviceIds || []).length > 2 ? " ..." : ""}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openAssign(o)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      <ListChecks size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleOffer(o._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Power size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteOffer(o._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))
        )}
      </div>

      {/* Create Modal */}
      {open && (
        <ModalShell
          title="Create New Offer"
          desc="Add an offer code with title, discount type, value, and status."
          onClose={() => setOpen(false)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createOffer}
                disabled={creating}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Offer"}
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            {/* Form */}
            <div className="xl:col-span-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-600">
                    Offer Title
                  </label>
                  <input
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Example: Festival Super Saver"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-600">
                    Offer Code
                  </label>
                  <input
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-indigo-400"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    placeholder="SAVE20"
                  />
                  <p className="mt-2 text-[11px] text-gray-500">
                    Auto uppercase. Spaces removed automatically.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-600">
                    Discount Type
                  </label>
                  <select
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({ ...form, discountType: e.target.value })
                    }
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-600">
                    Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: Number(e.target.value) })
                    }
                    placeholder="Enter value"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Activate this offer immediately
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="xl:col-span-2">
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-indigo-700">
                  <Sparkles size={16} />
                  Live Preview
                </div>

                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                      {form.discountType === "fixed" ? (
                        <IndianRupee size={20} />
                      ) : (
                        <BadgePercent size={20} />
                      )}
                    </div>

                    {form.isActive ? (
                      <Chip tone="green">Active</Chip>
                    ) : (
                      <Chip tone="gray">Inactive</Chip>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-black text-gray-900">
                      {form.title || "Offer title preview"}
                    </h3>
                    <p className="mt-1 font-mono text-xs font-bold text-gray-500">
                      {form.code || "CODE"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Chip tone="indigo" className="text-sm">
                      {form.discountType === "fixed"
                        ? `₹${Number(form.value || 0)} OFF`
                        : `${Number(form.value || 0)}% OFF`}
                    </Chip>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-gray-500">
                    This is how your offer block will feel inside admin.
                    Clean, premium, and easy to manage.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Assign Services Modal */}
      {assignOpen && (
        <ModalShell
          wide
          title={`Assign Services • ${assignOffer?.title || ""}`}
          desc="Select the services where this offer should appear on the user side."
          onClose={() => setAssignOpen(false)}
          footer={
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-gray-600">
                Selected services:{" "}
                <span className="font-black text-gray-900">
                  {selectedServiceIds.length}
                </span>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveAssign}
                  disabled={assignLoading}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assignLoading ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Left */}
            <div className="xl:col-span-2">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <Search size={18} className="text-gray-400" />
                  <input
                    value={serviceQ}
                    onChange={(e) => setServiceQ(e.target.value)}
                    placeholder="Search services by title or category..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    <CheckCheck size={16} />
                    {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedServiceIds([])}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-[58vh] overflow-auto rounded-3xl border border-gray-200 bg-slate-50 p-3">
                {filteredServices.length === 0 ? (
                  <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white text-center">
                    <div>
                      <p className="text-base font-black text-gray-900">
                        No services found
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Try another search keyword.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredServices.map((s) => {
                      const checked = selectedServiceIds.includes(s._id);

                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSelectedServiceIds((prev) =>
                              checked
                                ? prev.filter((x) => x !== s._id)
                                : [...prev, s._id]
                            );
                          }}
                          className={cn(
                            "rounded-3xl border p-4 text-left transition",
                            checked
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-gray-900">
                                {s.title}
                              </div>
                              <div className="mt-1 truncate text-xs text-gray-500">
                                {s.categoryName || s.category || "No category"}
                              </div>
                            </div>

                            <div
                              className={cn(
                                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                                checked
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-gray-300 bg-white"
                              )}
                            >
                              {checked ? <CheckCheck size={12} /> : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="xl:col-span-1">
              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-gray-900">
                  <Layers3 size={16} />
                  Selected Services
                </div>

                <div className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    Current Offer
                  </div>
                  <div className="mt-1 text-base font-black text-gray-900">
                    {assignOffer?.title || "-"}
                  </div>
                  <div className="mt-2">
                    <Chip tone="indigo">
                      {assignOffer?.discountType === "fixed"
                        ? `₹${assignOffer?.value || 0} OFF`
                        : `${assignOffer?.value || 0}% OFF`}
                    </Chip>
                  </div>
                </div>

                <div className="max-h-[44vh] overflow-auto">
                  {selectedServices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center">
                      <p className="text-sm font-bold text-gray-900">
                        No services selected
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose services from the left panel.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedServices.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-gray-900">
                              {s.title}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              {s.categoryName || s.category || "No category"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedServiceIds((prev) =>
                                prev.filter((id) => id !== s._id)
                              )
                            }
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-gray-500">
                  Selected services will show this offer on the user side. Keep
                  the assignment clean and relevant.
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Total Selected
                    </div>
                    <div className="text-xl font-black text-gray-900">
                      {selectedServiceIds.length}
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={18} />
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}