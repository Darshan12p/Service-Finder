import React, { useEffect, useMemo, useState } from "react";
import {
  adminGetCategoriesApi,
  getUsersApi,
  toggleUserActiveApi,
  updatePartnerSettingsApi,
} from "../../services/api";
import Swal from "sweetalert2";
import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  BadgeCheck,
  Clock3,
  MapPin,
  Phone,
  Mail,
  Settings2,
  X,
  Save,
  Filter,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react";

const ROLES = [
  { label: "Customer", value: "customer" },
  { label: "Partner", value: "partner" },
  { label: "Admin", value: "admin" },
];

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_WORKING_SLOTS = WEEK_DAYS.map((day) => ({
  day,
  startTime: "09:00",
  endTime: "18:00",
  isAvailable: true,
}));

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Badge({ children, tone = "gray" }) {
  const styles = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        styles[tone] || styles.gray
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, tone = "default" }) {
  const toneClass =
    tone === "green"
      ? "from-emerald-500/10 to-emerald-100 border-emerald-200"
      : tone === "blue"
      ? "from-indigo-500/10 to-indigo-100 border-indigo-200"
      : tone === "purple"
      ? "from-violet-500/10 to-violet-100 border-violet-200"
      : "from-gray-500/10 to-gray-100 border-gray-200";

  return (
    <div
      className={cn(
        "rounded-3xl border bg-gradient-to-br p-5 shadow-sm",
        toneClass
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">{icon}</div>
      </div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function InfoPill({ icon, text }) {
  if (!text) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export default function UsersTable({ role }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState("all");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [savingPartner, setSavingPartner] = useState(false);

  const [partnerForm, setPartnerForm] = useState({
    isApproved: false,
    isAvailable: true,
    serviceCategories: [],
    citiesText: "",
    pincodesText: "",
    maxBookingsPerDay: 5,
    priority: 0,
    workingSlots: DEFAULT_WORKING_SLOTS,
  });

  const title =
    role === "customer"
      ? "Customers"
      : role === "partner"
      ? "Service Partners"
      : "Admin Users";

  const subtitle =
    role === "customer"
      ? "View and manage all registered customers"
      : role === "partner"
      ? "Approve, configure and manage service partner assignments"
      : "Manage platform administrators";

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setMsg("");

      const params = {
        role,
        search,
        page,
        limit: pagination.limit,
      };

      if (role === "partner" && approved !== "all") {
        params.approved = approved;
      }

      const res = await getUsersApi(params);

      setItems(res?.data?.items || []);
      setPagination(
        res?.data?.pagination || {
          page: 1,
          limit: 20,
          totalPages: 1,
          total: 0,
        }
      );
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await adminGetCategoriesApi();
      const all = res?.data?.categories || [];
      const activeOnly = all.filter((c) => c?.isActive !== false);
      setCategoryOptions(activeOnly);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  useEffect(() => {
    load(1);
    if (role === "partner") {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, approved]);

  const toggleActive = async (id) => {
    try {
      const res = await toggleUserActiveApi(id);
      const updated = res?.data?.user;
      setItems((prev) => prev.map((u) => (u._id === id ? updated : u)));

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: updated?.isActive
          ? "User unblocked successfully"
          : "User blocked successfully",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to update user",
      });
    }
  };

  const changeRole = async (id, newRole, currentRole) => {
    if (role === "partner") {
      Swal.fire({
        icon: "info",
        title: "Use Join Inquiry Approval",
        text: "Partner role should come from approved Join Inquiry, not from manual role change.",
      });
      return;
    }

    if (currentRole === newRole) return;

    const result = await Swal.fire({
      title: `Change role to "${newRole}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Change Role",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
    });

    if (!result.isConfirmed) return;

    try {
      const { changeUserRoleApi } = await import("../../services/api");
      const res = await changeUserRoleApi(id, newRole);
      const updated = res?.data?.user;

      setItems((prev) => prev.filter((u) => u._id !== id));
      setMsg(`✅ Role updated for ${updated?.email || "user"}`);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to change role",
      });
    }
  };

  const openPartnerModal = (user) => {
    const workingSlots =
      Array.isArray(user?.partner?.workingSlots) && user.partner.workingSlots.length
        ? WEEK_DAYS.map((day) => {
            const existing = user.partner.workingSlots.find((s) => s.day === day);
            return (
              existing || {
                day,
                startTime: "09:00",
                endTime: "18:00",
                isAvailable: true,
              }
            );
          })
        : DEFAULT_WORKING_SLOTS;

    setSelectedPartner(user);
    setPartnerForm({
      isApproved: !!user?.partner?.isApproved,
      isAvailable:
        typeof user?.partner?.isAvailable === "boolean"
          ? user.partner.isAvailable
          : true,
      serviceCategories: user?.partner?.serviceCategories || [],
      citiesText: (user?.partner?.cities || []).join(", "),
      pincodesText: (user?.partner?.pincodes || []).join(", "),
      maxBookingsPerDay: user?.partner?.maxBookingsPerDay || 5,
      priority: user?.partner?.priority || 0,
      workingSlots,
    });
    setPartnerModalOpen(true);
  };

  const closePartnerModal = () => {
    setPartnerModalOpen(false);
    setSelectedPartner(null);
    setSavingPartner(false);
  };

  const updateWorkingSlot = (index, key, value) => {
    setPartnerForm((prev) => {
      const nextSlots = [...prev.workingSlots];
      nextSlots[index] = {
        ...nextSlots[index],
        [key]: value,
      };
      return { ...prev, workingSlots: nextSlots };
    });
  };

  const toggleCategorySelection = (categoryName) => {
    setPartnerForm((prev) => {
      const exists = prev.serviceCategories.includes(categoryName);

      return {
        ...prev,
        serviceCategories: exists
          ? prev.serviceCategories.filter((name) => name !== categoryName)
          : [...prev.serviceCategories, categoryName],
      };
    });
  };

  const savePartnerSettings = async () => {
    if (!selectedPartner?._id) return;

    try {
      setSavingPartner(true);

      const payload = {
        isApproved: !!partnerForm.isApproved,
        isAvailable: !!partnerForm.isAvailable,
        serviceCategories: partnerForm.serviceCategories,
        cities: parseCsv(partnerForm.citiesText),
        pincodes: parseCsv(partnerForm.pincodesText),
        maxBookingsPerDay: Number(partnerForm.maxBookingsPerDay || 5),
        priority: Number(partnerForm.priority || 0),
        workingSlots: partnerForm.workingSlots.map((slot) => ({
          day: slot.day,
          startTime: slot.startTime || "09:00",
          endTime: slot.endTime || "18:00",
          isAvailable: !!slot.isAvailable,
        })),
      };

      const res = await updatePartnerSettingsApi(selectedPartner._id, payload);
      const updated = res?.data?.user;

      setItems((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setMsg(`✅ Partner settings updated for ${updated.email}`);
      closePartnerModal();

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Partner settings updated successfully",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to update partner settings",
      });
    } finally {
      setSavingPartner(false);
    }
  };

  const partnerSummary = useMemo(() => {
    if (role !== "partner") return null;

    const total = items.length;
    const approvedCount = items.filter((u) => u?.partner?.isApproved).length;
    const availableCount = items.filter((u) => u?.partner?.isAvailable !== false).length;

    return { total, approvedCount, availableCount };
  }, [items, role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/40 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <ShieldCheck size={14} />
                Admin Panel
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>
              <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {loading ? (
                <div className="rounded-2xl border bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
                  Loading...
                </div>
              ) : (
                <div className="rounded-2xl border bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
                  Total Records: <span className="font-semibold">{pagination.total || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {msg ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            {msg}
          </div>
        ) : null}

        {/* Summary Cards */}
        {role === "partner" && partnerSummary ? (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={<Users className="h-6 w-6 text-gray-700" />}
              label="Partners on this page"
              value={partnerSummary.total}
            />
            <StatCard
              icon={<UserCheck className="h-6 w-6 text-emerald-700" />}
              label="Approved Partners"
              value={partnerSummary.approvedCount}
              tone="green"
            />
            <StatCard
              icon={<BadgeCheck className="h-6 w-6 text-indigo-700" />}
              label="Available for Booking"
              value={partnerSummary.availableCount}
              tone="blue"
            />
          </div>
        ) : null}

        {/* Filters */}
        <div className="mb-6 rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {role === "partner" ? (
                <>
                  <button
                    onClick={() => setApproved("all")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      approved === "all"
                        ? "border-indigo-600 bg-indigo-600 text-white shadow"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setApproved("true")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      approved === "true"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setApproved("false")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      approved === "false"
                        ? "border-amber-500 bg-amber-500 text-white shadow"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Pending
                  </button>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
                  <Filter size={16} />
                  Showing role: <span className="font-semibold capitalize">{role}</span>
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <div className="relative w-full md:w-[360px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Search email, name, phone, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load(1)}
                />
              </div>

              <button
                className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                onClick={() => load(1)}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users List</h2>
              <p className="text-xs text-gray-500">Manage status, role and partner settings</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">User</th>
                  <th className="px-5 py-4 text-left font-semibold">Verified</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  {role === "partner" ? (
                    <th className="px-5 py-4 text-left font-semibold">Approval</th>
                  ) : null}
                  {role === "partner" ? (
                    <th className="px-5 py-4 text-left font-semibold">Assignment Info</th>
                  ) : null}
                  <th className="px-5 py-4 text-left font-semibold">Role</th>
                  <th className="px-5 py-4 text-left font-semibold">Created</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-gray-100 align-top transition hover:bg-gray-50/70"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex min-w-[260px] items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-700">
                          {(u.profile?.name || u.email || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900">{u.profile?.name || "Unnamed User"}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} />
                            <span>{u.email}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <InfoPill
                              icon={<Phone size={12} />}
                              text={u.profile?.phone}
                            />
                            <InfoPill
                              icon={<MapPin size={12} />}
                              text={u.profile?.city}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Verified */}
                    <td className="px-5 py-4">
                      {u.isVerified ? (
                        <Badge tone="green">Verified</Badge>
                      ) : (
                        <Badge>Not Verified</Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {u.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="red">Blocked</Badge>
                      )}
                    </td>

                    {/* Approval */}
                    {role === "partner" ? (
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {u.partner?.isApproved ? (
                            <Badge tone="green">Approved</Badge>
                          ) : (
                            <Badge tone="yellow">Pending</Badge>
                          )}

                          <div className="text-xs">
                            {u.partner?.joinInquiryId ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CircleCheckBig size={13} />
                                Inquiry linked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-500">
                                <CircleAlert size={13} />
                                No inquiry link
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    ) : null}

                    {/* Assignment Info */}
                    {role === "partner" ? (
                      <td className="px-5 py-4">
                        <div className="min-w-[280px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                          <div className="mb-2 flex flex-wrap gap-2">
                            {u.partner?.isAvailable === false ? (
                              <Badge tone="red">Unavailable</Badge>
                            ) : (
                              <Badge tone="green">Available</Badge>
                            )}
                            <Badge tone="blue">
                              Max/Day: {u.partner?.maxBookingsPerDay || 5}
                            </Badge>
                            <Badge tone="purple">
                              Priority: {u.partner?.priority || 0}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-gray-900">Categories:</span>{" "}
                              {(u.partner?.serviceCategories || []).length
                                ? u.partner.serviceCategories.join(", ")
                                : "-"}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">Cities:</span>{" "}
                              {(u.partner?.cities || []).length
                                ? u.partner.cities.join(", ")
                                : "-"}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">Pincodes:</span>{" "}
                              {(u.partner?.pincodes || []).length
                                ? u.partner.pincodes.join(", ")
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                    ) : null}

                    {/* Role */}
                    <td className="px-5 py-4">
                      <Badge tone="blue">{u.role || "customer"}</Badge>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4 text-gray-600">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={14} />
                        <span>
                          {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex min-w-[220px] flex-col items-end gap-2">
                        {role === "partner" ? (
                          <button
                            onClick={() => openPartnerModal(u)}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Settings2 size={14} />
                            Edit Partner
                          </button>
                        ) : null}

                        <button
                          onClick={() => toggleActive(u._id)}
                          className={cn(
                            "rounded-xl px-3 py-2 text-xs font-semibold transition",
                            u.isActive
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          )}
                        >
                          {u.isActive ? "Block User" : "Unblock User"}
                        </button>

                        <select
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
                          value={u.role || "customer"}
                          onChange={(e) =>
                            changeRole(u._id, e.target.value, u.role || "customer")
                          }
                          disabled={role === "partner"}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>

                        {role === "partner" ? (
                          <div className="text-[11px] text-gray-400">
                            Role locked to inquiry flow
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && items.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-gray-500"
                      colSpan={role === "partner" ? 8 : 6}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-gray-300" />
                        <p className="font-medium">No users found</p>
                        <p className="text-xs text-gray-400">
                          Try changing filter or search text
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
            <span className="text-gray-600">
              Page <span className="font-semibold">{pagination.page}</span> of{" "}
              <span className="font-semibold">{pagination.totalPages}</span> • Total{" "}
              <span className="font-semibold">{pagination.total || 0}</span>
            </span>

            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Modal */}
      {partnerModalOpen && selectedPartner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <Briefcase size={14} />
                  Partner Configuration
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Partner Settings</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedPartner.email}</p>
              </div>

              <button
                onClick={closePartnerModal}
                className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Basic Settings */}
                <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5">
                  <h3 className="mb-5 text-lg font-semibold text-gray-900">Basic Settings</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">Approved</span>
                      <input
                        type="checkbox"
                        checked={partnerForm.isApproved}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            isApproved: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">
                        Available for assignment
                      </span>
                      <input
                        type="checkbox"
                        checked={partnerForm.isAvailable}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            isAvailable: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800">
                        Max Bookings Per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                        value={partnerForm.maxBookingsPerDay}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            maxBookingsPerDay: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800">
                        Priority
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                        value={partnerForm.priority}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            priority: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Coverage & Skills */}
                <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5">
                  <h3 className="mb-5 text-lg font-semibold text-gray-900">Coverage & Skills</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800">
                        Service Categories
                      </label>

                      <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border bg-white p-3">
                        {categoryOptions.length === 0 ? (
                          <p className="text-sm text-gray-500">No active categories found</p>
                        ) : (
                          categoryOptions.map((cat) => {
                            const checked = partnerForm.serviceCategories.includes(cat.name);

                            return (
                              <label
                                key={cat._id}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-3 transition",
                                  checked
                                    ? "border-indigo-300 bg-indigo-50"
                                    : "border-transparent hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategorySelection(cat.name)}
                                  />
                                  <span className="text-sm font-medium text-gray-800">
                                    {cat.name}
                                  </span>
                                </div>

                                {checked ? <Badge tone="blue">Selected</Badge> : null}
                              </label>
                            );
                          })
                        )}
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Select one or more real service categories
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800">
                        Cities
                      </label>
                      <input
                        type="text"
                        placeholder="Ahmedabad, Anand"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                        value={partnerForm.citiesText}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            citiesText: e.target.value,
                          }))
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">Separate by comma</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800">
                        Pincodes
                      </label>
                      <input
                        type="text"
                        placeholder="380001, 388001"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                        value={partnerForm.pincodesText}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            pincodesText: e.target.value,
                          }))
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">Separate by comma</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Schedule */}
              <div className="mt-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Clock3 size={18} className="text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Working Schedule</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {partnerForm.workingSlots.map((slot, index) => (
                    <div
                      key={slot.day}
                      className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{slot.day}</div>
                        <Badge tone={slot.isAvailable ? "green" : "red"}>
                          {slot.isAvailable ? "Available" : "Off"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input
                          type="time"
                          className="rounded-2xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateWorkingSlot(index, "startTime", e.target.value)
                          }
                        />

                        <input
                          type="time"
                          className="rounded-2xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateWorkingSlot(index, "endTime", e.target.value)
                          }
                        />

                        <label className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={slot.isAvailable}
                            onChange={(e) =>
                              updateWorkingSlot(index, "isAvailable", e.target.checked)
                            }
                          />
                          Available
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Alert */}
              {selectedPartner?.partner?.joinInquiryId ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  This partner is linked with approved Join Inquiry flow.
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  This partner has no linked join inquiry. Old/manual data may exist.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row">
              <button
                onClick={closePartnerModal}
                className="rounded-2xl border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                disabled={savingPartner}
              >
                Cancel
              </button>

              <button
                onClick={savePartnerSettings}
                disabled={savingPartner}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save size={16} />
                {savingPartner ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}