// src/admin/pages/ServiceCategories.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Search as SearchIcon,
  Pencil,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  adminGetCategoriesApi,
  adminCreateCategoryApi,
  adminToggleCategoryApi,
  adminDeleteCategoryApi,
  adminUpdateCategoryApi,
} from "../../services/api";

export default function ServiceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ui filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all|active|inactive

  // modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // form
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");
  const makeImg = (raw) => {
    if (!raw) return "";
    if (raw.startsWith("http")) return raw;
    return `${apiBase}${raw}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetCategoriesApi();
      setCategories(res?.data?.categories || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setImageFile(null);
    setImagePreview("");
    setSortOrder(0);
    setIsActive(true);
    setError("");
    setSaving(false);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditId(c._id);
    setName(c.name || "");
    setImageFile(null);
    setImagePreview(c.imageUrl ? makeImg(c.imageUrl) : "");
    setSortOrder(c.sortOrder ?? 0);
    setIsActive(!!c.isActive);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    setError("");
    if (!name.trim()) return setError("Category name is required");

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("sortOrder", Number(sortOrder) || 0);
      fd.append("isActive", isActive);
      if (imageFile) fd.append("image", imageFile);

      if (editId) await adminUpdateCategoryApi(editId, fd);
      else await adminCreateCategoryApi(fd);

      setOpen(false);
      resetForm();
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    try {
      await adminToggleCategoryApi(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || "Toggle failed");
    }
  };

  const del = async (id) => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: "This category will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await adminDeleteCategoryApi(id);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Category deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      load();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e?.response?.data?.message || "Something went wrong",
      });
    }
  };

  // --------- filtered list + stats ----------
  const filtered = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    return (categories || [])
      .filter((c) => {
        if (status === "active") return c.isActive !== false;
        if (status === "inactive") return c.isActive === false;
        return true;
      })
      .filter((c) => {
        if (!query) return true;
        return (c.name || "").toLowerCase().includes(query);
      })
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [categories, q, status]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [categories]);

  const Badge = ({ children, tone = "slate" }) => {
    const map = {
      slate: "bg-slate-50 text-slate-700 border-slate-200",
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      gray: "bg-slate-50 text-slate-500 border-slate-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${map[tone]}`}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Service Categories
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Create categories, upload images, set sort order and status.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-extrabold hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-bold text-slate-500">TOTAL</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-bold text-slate-500">ACTIVE</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">
              {stats.active}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-bold text-slate-500">INACTIVE</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-700">
              {stats.inactive}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 rounded-3xl border bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2">
                <SearchIcon size={18} className="text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Search category name..."
                />
                <button
                  onClick={() => setQ("")}
                  className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <select
              className="rounded-2xl border bg-white px-3 py-2 text-sm font-semibold"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <p>
              Showing{" "}
              <span className="font-extrabold text-slate-900">
                {filtered.length}
              </span>{" "}
              categories
            </p>
            <button
              onClick={load}
              className="text-indigo-700 font-extrabold hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="mt-5 hidden lg:block rounded-3xl border bg-white overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="font-extrabold text-slate-900">
              Category List{" "}
              {loading ? (
                <span className="text-xs text-slate-500">(loading)</span>
              ) : null}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Sort</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {c.imageUrl ? (
                          <img
                            src={makeImg(c.imageUrl)}
                            alt={c.name}
                            className="w-12 h-12 rounded-xl object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border bg-slate-50 grid place-items-center text-slate-400">
                            <ImageIcon size={18} />
                          </div>
                        )}

                        <div>
                          <p className="font-extrabold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500">{c._id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">{Number(c.sortOrder ?? 0)}</td>

                    <td className="p-3">
                      <button
                        onClick={() => toggle(c._id)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => del(c._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-slate-500" colSpan={4}>
                      No categories found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border bg-white p-4">
                <div className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="mt-3 h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="mt-5 h-10 bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border bg-white p-8 text-center text-slate-600 md:col-span-2">
              No categories yet. Click “Add Category”.
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c._id} className="rounded-3xl border bg-white p-4">
                <div className="flex items-start gap-3">
                  {c.imageUrl ? (
                    <img
                      src={makeImg(c.imageUrl)}
                      alt={c.name}
                      className="w-16 h-16 rounded-2xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border bg-slate-50 grid place-items-center text-slate-400">
                      <ImageIcon size={18} />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-lg font-extrabold text-slate-900">
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sort: {Number(c.sortOrder ?? 0)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={c.isActive ? "green" : "gray"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge tone="indigo">ID</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-2xl border px-4 py-2 font-extrabold hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => del(c._id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 font-extrabold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => toggle(c._id)}
                    className={`col-span-2 rounded-2xl px-4 py-2 font-extrabold border ${
                      c.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {c.isActive ? "Set Inactive" : "Set Active"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[28px] bg-white shadow-xl border overflow-hidden">
            <div className="p-4 sm:p-5 border-b flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-semibold">
                  {editId ? "Edit Category" : "Create Category"}
                </p>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editId ? "Update category details" : "Add a new category"}
                </h2>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-2xl border hover:bg-slate-50 grid place-items-center"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-extrabold text-slate-800">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="e.g. Cleaning"
                />
              </div>

              {/* Image upload */}
              <div className="rounded-3xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-slate-900">
                    Category Image
                  </p>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setImageFile(file || null);
                      setImagePreview(
                        file ? URL.createObjectURL(file) : imagePreview,
                      );
                    }}
                    className="w-full rounded-2xl border bg-white px-3 py-3"
                  />

                  <div className="rounded-2xl border bg-white overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 grid place-items-center text-slate-400">
                        <ImageIcon size={22} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-extrabold text-slate-800">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-2 w-full rounded-2xl border px-4 py-3"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 w-full">
                    <input
                      id="active"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label
                      htmlFor="active"
                      className="text-sm font-extrabold text-slate-800"
                    >
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-2xl border px-5 py-3 font-extrabold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={save}
                disabled={saving}
                className={`rounded-2xl px-5 py-3 font-extrabold text-white transition ${
                  saving
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
