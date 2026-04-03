import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  createServiceApi,
  deleteServiceApi,
  getServicesApi,
  toggleServiceApi,
  updateServiceApi,
  updateServicePopularityApi,
  adminGetCategoriesApi,
} from "../../services/api";

import {
  Plus,
  Search as SearchIcon,
  Filter,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Star,
  Sparkles,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const makeOption = (sortOrder = 0) => ({
  label: "",
  description: "",
  price: 0,
  isActive: true,
  sortOrder,
});

const makeOptionGroup = (sortOrder = 0) => ({
  name: "",
  type: "single", // single | multiple
  isRequired: false,
  sortOrder,
  options: [makeOption(0)],
});

const makePackage = (name = "Package", sortOrder = 0) => ({
  name,
  description: "",
  basePrice: 0,
  price: 0, // compatibility
  durationMins: 60,
  features: [""],
  isActive: true,
  sortOrder,
  optionGroups: [],
});

const defaultPackages = () => [
  makePackage("Basic", 0),
  makePackage("Standard", 1),
  makePackage("Premium", 2),
];

export default function Services() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [dbCategories, setDbCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [savingPopularityId, setSavingPopularityId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [packages, setPackages] = useState(defaultPackages());
  const [expandedPkgs, setExpandedPkgs] = useState({});

  const [form, setForm] = useState({
    title: "",
    category: "",
    categoryId: "",
    price: 0,
    isActive: true,
    isPopular: false,
    popularBoost: 0,
  });
  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");
  const makeImg = (raw) => {
    if (!raw) return "";
    if (raw.startsWith("http")) return raw;
    return `${apiBase}${raw}`;
  };

  const normalizeServicePackage = (p, idx) => ({
    name: p?.name || `Package ${idx + 1}`,
    description: p?.description || "",
    basePrice: Number(p?.basePrice ?? p?.price ?? 0),
    price: Number(p?.price ?? p?.basePrice ?? 0),
    durationMins: Number(p?.durationMins || 60),
    features:
      Array.isArray(p?.features) && p.features.length ? p.features : [""],
    isActive: p?.isActive !== false,
    sortOrder: Number(p?.sortOrder ?? idx),
    optionGroups: Array.isArray(p?.optionGroups)
      ? p.optionGroups.map((g, gIdx) => ({
          name: g?.name || `Group ${gIdx + 1}`,
          type: g?.type === "multiple" ? "multiple" : "single",
          isRequired: !!g?.isRequired,
          sortOrder: Number(g?.sortOrder ?? gIdx),
          options:
            Array.isArray(g?.options) && g.options.length
              ? g.options.map((o, oIdx) => ({
                  label: o?.label || o?.name || `Option ${oIdx + 1}`,
                  description: o?.description || "",
                  price: Number(o?.price || 0),
                  isActive: o?.isActive !== false,
                  sortOrder: Number(o?.sortOrder ?? oIdx),
                }))
              : [makeOption(0)],
        }))
      : [],
  });

  const loadCategories = async () => {
    try {
      setCatLoading(true);
      const res = await adminGetCategoriesApi();
      const cats = res?.data?.categories || [];
      const sorted = [...cats].sort(
        (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
      );

      setDbCategories(sorted);

      const firstCat = sorted?.[0] || null;
      setForm((prev) => ({
        ...prev,
        category: prev.category || firstCat?.name || "",
        categoryId: prev.categoryId || firstCat?._id || "",
      }));
    } catch (e) {
      console.log("Category load failed:", e);
    } finally {
      setCatLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      setMsg("");

      const res = await getServicesApi({
        search,
        category: category === "All" ? "" : category,
        status,
        page: 1,
        limit: 200,
      });

      setItems(res?.data?.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadServices();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  const openCreate = () => {
    setEditing(null);
    const firstCat = dbCategories?.[0] || null;
    setForm({
      title: "",
      category: firstCat?.name || "",
      categoryId: firstCat?._id || "",
      price: 0,
      isActive: true,
      isPopular: false,
      popularBoost: 0,
    });
    const pkgs = defaultPackages();
    setPackages(pkgs);
    setExpandedPkgs({ 0: true });
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
    setMsg("");
  };

  const openEdit = (service) => {
    setEditing(service);

    setForm({
      title: service.title || "",
      category: service.category || dbCategories?.[0]?.name || "",
      categoryId: service.categoryId || dbCategories?.[0]?._id || "",
      price: service.price || 0,
      isActive: !!service.isActive,
      isPopular: !!service.isPopular,
      popularBoost: Number(service.popularBoost || 0),
    });

    setImageFile(null);
    setImagePreview(service.imageUrl ? makeImg(service.imageUrl) : "");

    const pkgs = service.packages?.length
      ? service.packages
      : defaultPackages();
    const normalized = pkgs.map(normalizeServicePackage);

    setPackages(normalized);
    setExpandedPkgs(
      normalized.reduce((acc, _, idx) => {
        acc[idx] = idx === 0;
        return acc;
      }, {}),
    );

    setIsModalOpen(true);
    setMsg("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setSubmitting(false);
    setImageFile(null);
    setImagePreview("");
    setPackages(defaultPackages());
    setExpandedPkgs({});
  };

  const updatePkg = (pkgIndex, patch) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === pkgIndex ? { ...pkg, ...patch } : pkg)),
    );
  };

  const updatePkgFeature = (pkgIndex, featureIndex, value) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const features = [...(pkg.features || [])];
        features[featureIndex] = value;
        return { ...pkg, features };
      }),
    );
  };

  const addPkgFeature = (pkgIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) =>
        i === pkgIndex
          ? { ...pkg, features: [...(pkg.features || []), ""] }
          : pkg,
      ),
    );
  };

  const removePkgFeature = (pkgIndex, featureIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const features = (pkg.features || []).filter(
          (_, x) => x !== featureIndex,
        );
        return { ...pkg, features: features.length ? features : [""] };
      }),
    );
  };

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      makePackage(`Package ${prev.length + 1}`, prev.length),
    ]);
    setExpandedPkgs((prev) => ({ ...prev, [packages.length]: true }));
  };

  const removePackage = (pkgIndex) => {
    setPackages((prev) => prev.filter((_, i) => i !== pkgIndex));
  };

  const addOptionGroup = (pkgIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const groups = [
          ...(pkg.optionGroups || []),
          makeOptionGroup((pkg.optionGroups || []).length),
        ];
        return { ...pkg, optionGroups: groups };
      }),
    );
  };

  const updateOptionGroup = (pkgIndex, groupIndex, patch) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const optionGroups = (pkg.optionGroups || []).map((g, gi) =>
          gi === groupIndex ? { ...g, ...patch } : g,
        );
        return { ...pkg, optionGroups };
      }),
    );
  };

  const removeOptionGroup = (pkgIndex, groupIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const optionGroups = (pkg.optionGroups || []).filter(
          (_, gi) => gi !== groupIndex,
        );
        return { ...pkg, optionGroups };
      }),
    );
  };

  const addOption = (pkgIndex, groupIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const optionGroups = (pkg.optionGroups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          const options = [
            ...(g.options || []),
            makeOption((g.options || []).length),
          ];
          return { ...g, options };
        });
        return { ...pkg, optionGroups };
      }),
    );
  };

  const updateOption = (pkgIndex, groupIndex, optionIndex, patch) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const optionGroups = (pkg.optionGroups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          const options = (g.options || []).map((o, oi) =>
            oi === optionIndex ? { ...o, ...patch } : o,
          );
          return { ...g, options };
        });
        return { ...pkg, optionGroups };
      }),
    );
  };

  const removeOption = (pkgIndex, groupIndex, optionIndex) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== pkgIndex) return pkg;
        const optionGroups = (pkg.optionGroups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          const options = (g.options || []).filter(
            (_, oi) => oi !== optionIndex,
          );
          return { ...g, options: options.length ? options : [makeOption(0)] };
        });
        return { ...pkg, optionGroups };
      }),
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.title.trim()) return setMsg("Enter service title");
    if (!form.category?.trim()) return setMsg("Select category");

    try {
      setSubmitting(true);

      const cleanedPackages = (packages || []).map((pkg, idx) => ({
        name: (pkg.name || `Package ${idx + 1}`).trim(),
        description: (pkg.description || "").trim(),
        basePrice: Number(pkg.basePrice ?? pkg.price ?? 0) || 0,
        price: Number(pkg.basePrice ?? pkg.price ?? 0) || 0, // compatibility
        durationMins: Number(pkg.durationMins) || 60,
        features: (pkg.features || [])
          .map((x) => (x || "").trim())
          .filter(Boolean),
        isActive: pkg.isActive !== false,
        sortOrder: Number(pkg.sortOrder ?? idx),
        optionGroups: (pkg.optionGroups || [])
          .map((group, gIdx) => ({
            name: (group.name || `Group ${gIdx + 1}`).trim(),
            type: group.type === "multiple" ? "multiple" : "single",
            isRequired: !!group.isRequired,
            sortOrder: Number(group.sortOrder ?? gIdx),
            options: (group.options || [])
              .map((opt, oIdx) => ({
                label: (opt.label || `Option ${oIdx + 1}`).trim(),
                description: (opt.description || "").trim(),
                price: Number(opt.price || 0) || 0,
                isActive: opt.isActive !== false,
                sortOrder: Number(opt.sortOrder ?? oIdx),
              }))
              .filter((opt) => opt.label),
          }))
          .filter((group) => group.name),
      }));

      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("categoryId", form.categoryId || "");
      fd.append("category", form.category);
      fd.append("price", Number(form.price || 0));
      fd.append("isActive", form.isActive);
      fd.append("isPopular", form.isPopular);
      fd.append("popularBoost", Number(form.popularBoost || 0));
      fd.append("packages", JSON.stringify(cleanedPackages));
      if (imageFile) fd.append("image", imageFile);

      if (editing?._id) {
        const res = await updateServiceApi(editing._id, fd);
        setItems((prev) =>
          prev.map((x) => (x._id === editing._id ? res.data.service : x)),
        );
        setMsg("✅ Service updated");
      } else {
        const res = await createServiceApi(fd);
        setItems((prev) => [res.data.service, ...prev]);
        setMsg("✅ Service created");
      }

      closeModal();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = async (id) => {
    try {
      const res = await toggleServiceApi(id);
      setItems((prev) =>
        prev.map((x) => (x._id === id ? res.data.service : x)),
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Toggle failed");
    }
  };

  const onDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Service?",
      text: "This service will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteServiceApi(id);

      setItems((prev) => prev.filter((x) => x._id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Service deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const updatePopularity = async (id, payload) => {
    try {
      setSavingPopularityId(id);
      setItems((prev) =>
        prev.map((x) => (x._id === id ? { ...x, ...payload } : x)),
      );
      const res = await updateServicePopularityApi(id, payload);
      setItems((prev) =>
        prev.map((x) => (x._id === id ? res.data.service : x)),
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Popularity update failed");
      loadServices();
    } finally {
      setSavingPopularityId(null);
    }
  };

  const categoryOptions = useMemo(() => {
    const names = (dbCategories || []).map((c) => c.name).filter(Boolean);
    return ["All", ...names];
  }, [dbCategories]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.isActive).length;
    const inactive = total - active;
    const popular = items.filter((x) => x.isPopular).length;
    return { total, active, inactive, popular };
  }, [items]);

  const shown = items;

  const Badge = ({ children, tone = "slate" }) => {
    const map = {
      slate: "bg-slate-50 text-slate-700 border-slate-200",
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      gray: "bg-slate-50 text-slate-500 border-slate-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Services
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage services, packages, images and popularity ranking.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-extrabold hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {msg ? (
          <div className="mt-4 rounded-2xl border bg-white p-3 text-sm text-slate-700">
            {msg}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-bold text-slate-500">POPULAR</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-700">
              {stats.popular}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter size={18} />
              <p className="font-extrabold">Filters</p>
              {catLoading ? (
                <span className="text-xs text-slate-400">
                  (loading categories)
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full lg:max-w-5xl">
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2">
                  <SearchIcon size={18} className="text-slate-500" />
                  <input
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    onClick={loadServices}
                    className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-black transition"
                  >
                    Search
                  </button>
                </div>
              </div>

              <select
                className="rounded-2xl border bg-white px-3 py-2 text-sm font-semibold"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

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
          </div>
        </div>

        <div className="mt-5 hidden lg:block rounded-3xl border bg-white overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="font-extrabold text-slate-900">
              Services List{" "}
              {loading ? (
                <span className="text-xs text-slate-500">(loading)</span>
              ) : null}
            </p>
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-extrabold text-slate-900">
                {shown.length}
              </span>{" "}
              services
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Service</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Base Price</th>
                  <th className="text-left p-3">Used</th>
                  <th className="text-left p-3">Popular</th>
                  <th className="text-left p-3">Boost</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {shown.map((s) => {
                  const saving = savingPopularityId === s._id;
                  return (
                    <tr key={s._id} className="border-t hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {s.imageUrl ? (
                            <img
                              src={makeImg(s.imageUrl)}
                              alt={s.title}
                              className="w-12 h-12 rounded-xl object-cover border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl border bg-slate-50 grid place-items-center text-slate-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {s.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.packages?.length
                                ? `${s.packages.length} packages`
                                : "No packages"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">{s.category}</td>
                      <td className="p-3 font-semibold">
                        ₹{Number(s.price || 0)}
                      </td>
                      <td className="p-3">{Number(s.usageCount || 0)}</td>

                      <td className="p-3">
                        <button
                          disabled={saving}
                          onClick={() =>
                            updatePopularity(s._id, { isPopular: !s.isPopular })
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold transition ${
                            s.isPopular
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-white text-slate-700 border-slate-200"
                          } ${saving ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"}`}
                        >
                          <Sparkles size={14} />
                          {s.isPopular ? "Popular" : "Not popular"}
                        </button>
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          className="border px-3 py-2 w-24 rounded-xl"
                          value={Number(s.popularBoost || 0)}
                          disabled={saving}
                          onChange={(e) =>
                            updatePopularity(s._id, {
                              popularBoost: e.target.value,
                            })
                          }
                        />
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => onToggle(s._id)}
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            s.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold hover:bg-slate-50"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(s._id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && shown.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-slate-500" colSpan={8}>
                      No services found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border bg-white p-4">
                <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="mt-3 h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="mt-5 h-10 bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            ))
          ) : shown.length === 0 ? (
            <div className="rounded-3xl border bg-white p-8 text-center text-slate-600 md:col-span-2">
              No services found
            </div>
          ) : (
            shown.map((s) => {
              const saving = savingPopularityId === s._id;
              return (
                <div key={s._id} className="rounded-3xl border bg-white p-4">
                  <div className="flex items-start gap-3">
                    {s.imageUrl ? (
                      <img
                        src={makeImg(s.imageUrl)}
                        alt={s.title}
                        className="w-16 h-16 rounded-2xl object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl border bg-slate-50 grid place-items-center text-slate-400">
                        <ImageIcon size={18} />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-lg font-extrabold text-slate-900">
                        {s.title}
                      </p>
                      <p className="text-sm text-slate-600">{s.category}</p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="indigo">₹{Number(s.price || 0)}</Badge>
                        <Badge tone="slate">
                          Used: {Number(s.usageCount || 0)}
                        </Badge>
                        <Badge tone={s.isActive ? "green" : "gray"}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {s.isPopular ? (
                          <Badge tone="amber">
                            <Star size={14} /> Popular
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-2xl border px-4 py-2 font-extrabold hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(s._id)}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 font-extrabold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => onToggle(s._id)}
                      className={`col-span-2 rounded-2xl px-4 py-2 font-extrabold border ${
                        s.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {s.isActive ? "Set Inactive" : "Set Active"}
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-slate-900">
                        Popularity
                      </p>
                      <button
                        disabled={saving}
                        onClick={() =>
                          updatePopularity(s._id, { isPopular: !s.isPopular })
                        }
                        className={`text-sm font-extrabold ${
                          s.isPopular ? "text-indigo-700" : "text-slate-700"
                        } ${saving ? "opacity-60" : "hover:underline"}`}
                      >
                        {s.isPopular ? "Unpin" : "Pin"}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Boost</span>
                      <input
                        type="number"
                        className="border px-3 py-2 w-28 rounded-xl bg-white"
                        value={Number(s.popularBoost || 0)}
                        disabled={saving}
                        onChange={(e) =>
                          updatePopularity(s._id, {
                            popularBoost: e.target.value,
                          })
                        }
                      />
                      {saving ? (
                        <span className="text-xs text-slate-500">Saving…</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[28px] bg-white shadow-xl border">
            <div className="sticky top-0 z-10 bg-white border-b p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-semibold">
                  {editing ? "Edit Service" : "Create Service"}
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {editing
                    ? "Update your service details"
                    : "Add a new service"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-2xl border hover:bg-slate-50 grid place-items-center"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="text-sm font-extrabold text-slate-800">
                  Title
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sofa Cleaning"
                />
              </div>

              <div className="rounded-3xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-slate-900">Service Image</p>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full rounded-2xl border bg-white px-3 py-3"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setImageFile(file || null);
                        setImagePreview(
                          file ? URL.createObjectURL(file) : imagePreview,
                        );
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Recommended: 1200×800 (JPG/PNG)
                    </p>
                  </div>

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-extrabold text-slate-800">
                    Category
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white"
                    value={form.categoryId}
                    onChange={(e) => {
                      const selected = dbCategories.find(
                        (c) => String(c._id) === String(e.target.value),
                      );
                      setForm({
                        ...form,
                        categoryId: selected?._id || "",
                        category: selected?.name || "",
                      });
                    }}
                  >
                    {(dbCategories || []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!dbCategories.length ? (
                    <div className="text-xs text-red-600 mt-2">
                      No categories found. Add category first.
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm font-extrabold text-slate-800">
                    Service Base Price (₹)
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border px-4 py-3"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 w-full">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-700" />
                    <p className="font-extrabold text-slate-900">Popularity</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      id="isPopular"
                      type="checkbox"
                      checked={!!form.isPopular}
                      onChange={(e) =>
                        setForm({ ...form, isPopular: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="isPopular"
                      className="text-sm text-slate-700 font-semibold"
                    >
                      Mark as Popular (pin)
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <label className="text-sm font-extrabold text-slate-800">
                    Popular Boost
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border px-4 py-3"
                    value={Number(form.popularBoost || 0)}
                    onChange={(e) =>
                      setForm({ ...form, popularBoost: e.target.value })
                    }
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Higher boost = show above in user list.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">
                      Packages
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Create flexible packages with custom option groups like
                      Urban Company.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addPackage}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border px-4 py-2 font-extrabold hover:bg-slate-50"
                  >
                    <Plus size={16} /> Add Package
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {packages.map((pkg, pkgIndex) => {
                    const isOpen = !!expandedPkgs[pkgIndex];

                    return (
                      <div
                        key={pkgIndex}
                        className="rounded-3xl border bg-white overflow-hidden"
                      >
                        <div className="p-4 border-b flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-extrabold text-slate-900">
                              {pkg.name || `Package ${pkgIndex + 1}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Base ₹{Number(pkg.basePrice || pkg.price || 0)} •{" "}
                              {Number(pkg.durationMins || 0)} mins •{" "}
                              {(pkg.optionGroups || []).length} group(s)
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-xl border px-3 py-2 text-sm font-extrabold hover:bg-slate-50"
                              onClick={() =>
                                setExpandedPkgs((prev) => ({
                                  ...prev,
                                  [pkgIndex]: !prev[pkgIndex],
                                }))
                              }
                            >
                              <span className="inline-flex items-center gap-2">
                                {isOpen ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                                {isOpen ? "Collapse" : "Expand"}
                              </span>
                            </button>

                            <button
                              type="button"
                              className="text-red-700 font-extrabold hover:underline"
                              onClick={() => removePackage(pkgIndex)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="p-4 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs font-bold text-slate-500">
                                  Package Name
                                </label>
                                <input
                                  className="mt-2 w-full rounded-2xl border px-4 py-3"
                                  value={pkg.name}
                                  onChange={(e) =>
                                    updatePkg(pkgIndex, {
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Basic / Standard / Premium"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-500">
                                  Base Price (₹)
                                </label>
                                <input
                                  type="number"
                                  className="mt-2 w-full rounded-2xl border px-4 py-3"
                                  value={pkg.basePrice}
                                  onChange={(e) =>
                                    updatePkg(pkgIndex, {
                                      basePrice: Number(e.target.value) || 0,
                                      price: Number(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-500">
                                  Duration (mins)
                                </label>
                                <input
                                  type="number"
                                  className="mt-2 w-full rounded-2xl border px-4 py-3"
                                  value={pkg.durationMins}
                                  onChange={(e) =>
                                    updatePkg(pkgIndex, {
                                      durationMins:
                                        Number(e.target.value) || 60,
                                    })
                                  }
                                />
                              </div>

                              <div className="flex items-end">
                                <label className="w-full flex items-center gap-2 rounded-2xl border px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={pkg.isActive !== false}
                                    onChange={(e) =>
                                      updatePkg(pkgIndex, {
                                        isActive: e.target.checked,
                                      })
                                    }
                                  />
                                  <span className="text-sm font-extrabold text-slate-800">
                                    Package Active
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-500">
                                Description
                              </label>
                              <textarea
                                rows={3}
                                className="mt-2 w-full rounded-2xl border px-4 py-3"
                                value={pkg.description || ""}
                                onChange={(e) =>
                                  updatePkg(pkgIndex, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Describe what this package includes..."
                              />
                            </div>

                            <div className="rounded-2xl border bg-slate-50 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-extrabold text-slate-900">
                                  Features
                                </p>
                                <button
                                  type="button"
                                  className="text-sm font-extrabold text-indigo-700 hover:underline"
                                  onClick={() => addPkgFeature(pkgIndex)}
                                >
                                  + Add Feature
                                </button>
                              </div>

                              <div className="mt-3 space-y-2">
                                {(pkg.features || []).map((f, fIndex) => (
                                  <div key={fIndex} className="flex gap-2">
                                    <input
                                      className="w-full rounded-2xl border px-4 py-3 bg-white"
                                      value={f}
                                      onChange={(e) =>
                                        updatePkgFeature(
                                          pkgIndex,
                                          fIndex,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g. Includes tools, 2 rooms..."
                                    />
                                    <button
                                      type="button"
                                      className="px-4 rounded-2xl border hover:bg-red-50 text-red-700 font-extrabold"
                                      onClick={() =>
                                        removePkgFeature(pkgIndex, fIndex)
                                      }
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-2xl border bg-slate-50 p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <p className="text-sm font-extrabold text-slate-900">
                                    Customization Groups
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Example: Room Type, Add-ons, Number of
                                    Rooms, Cleaning Type
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => addOptionGroup(pkgIndex)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-white border px-4 py-2 font-extrabold hover:bg-slate-50"
                                >
                                  <Plus size={16} />
                                  Add Group
                                </button>
                              </div>

                              <div className="mt-4 space-y-4">
                                {(pkg.optionGroups || []).length === 0 ? (
                                  <div className="rounded-2xl border border-dashed bg-white p-4 text-sm text-slate-500">
                                    No option groups added yet.
                                  </div>
                                ) : (
                                  (pkg.optionGroups || []).map(
                                    (group, groupIndex) => (
                                      <div
                                        key={groupIndex}
                                        className="rounded-2xl border bg-white p-4"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                            <div>
                                              <label className="text-xs font-bold text-slate-500">
                                                Group Name
                                              </label>
                                              <input
                                                className="mt-2 w-full rounded-2xl border px-4 py-3"
                                                value={group.name}
                                                onChange={(e) =>
                                                  updateOptionGroup(
                                                    pkgIndex,
                                                    groupIndex,
                                                    { name: e.target.value },
                                                  )
                                                }
                                                placeholder="e.g. Room Type"
                                              />
                                            </div>

                                            <div>
                                              <label className="text-xs font-bold text-slate-500">
                                                Selection Type
                                              </label>
                                              <select
                                                className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white"
                                                value={group.type}
                                                onChange={(e) =>
                                                  updateOptionGroup(
                                                    pkgIndex,
                                                    groupIndex,
                                                    { type: e.target.value },
                                                  )
                                                }
                                              >
                                                <option value="single">
                                                  Single Select
                                                </option>
                                                <option value="multiple">
                                                  Multiple Select
                                                </option>
                                              </select>
                                            </div>

                                            <div className="flex items-end">
                                              <label className="w-full flex items-center gap-2 rounded-2xl border px-4 py-3">
                                                <input
                                                  type="checkbox"
                                                  checked={!!group.isRequired}
                                                  onChange={(e) =>
                                                    updateOptionGroup(
                                                      pkgIndex,
                                                      groupIndex,
                                                      {
                                                        isRequired:
                                                          e.target.checked,
                                                      },
                                                    )
                                                  }
                                                />
                                                <span className="text-sm font-extrabold text-slate-800">
                                                  Required
                                                </span>
                                              </label>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            className="text-red-700 font-extrabold hover:underline"
                                            onClick={() =>
                                              removeOptionGroup(
                                                pkgIndex,
                                                groupIndex,
                                              )
                                            }
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        <div className="mt-4">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-extrabold text-slate-900">
                                              Options
                                            </p>
                                            <button
                                              type="button"
                                              className="text-sm font-extrabold text-indigo-700 hover:underline"
                                              onClick={() =>
                                                addOption(pkgIndex, groupIndex)
                                              }
                                            >
                                              + Add Option
                                            </button>
                                          </div>

                                          <div className="mt-3 space-y-3">
                                            {(group.options || []).map(
                                              (opt, optionIndex) => (
                                                <div
                                                  key={optionIndex}
                                                  className="rounded-2xl border bg-slate-50 p-4"
                                                >
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div>
                                                      <label className="text-xs font-bold text-slate-500">
                                                        Option Label
                                                      </label>
                                                      <input
                                                        className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white"
                                                        value={opt.label}
                                                        onChange={(e) =>
                                                          updateOption(
                                                            pkgIndex,
                                                            groupIndex,
                                                            optionIndex,
                                                            {
                                                              label:
                                                                e.target.value,
                                                            },
                                                          )
                                                        }
                                                        placeholder="e.g. Furnished Room"
                                                      />
                                                    </div>

                                                    <div>
                                                      <label className="text-xs font-bold text-slate-500">
                                                        Extra Price (₹)
                                                      </label>
                                                      <input
                                                        type="number"
                                                        className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white"
                                                        value={opt.price}
                                                        onChange={(e) =>
                                                          updateOption(
                                                            pkgIndex,
                                                            groupIndex,
                                                            optionIndex,
                                                            {
                                                              price:
                                                                Number(
                                                                  e.target
                                                                    .value,
                                                                ) || 0,
                                                            },
                                                          )
                                                        }
                                                      />
                                                    </div>

                                                    <div className="lg:col-span-2">
                                                      <label className="text-xs font-bold text-slate-500">
                                                        Description
                                                      </label>
                                                      <input
                                                        className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white"
                                                        value={
                                                          opt.description || ""
                                                        }
                                                        onChange={(e) =>
                                                          updateOption(
                                                            pkgIndex,
                                                            groupIndex,
                                                            optionIndex,
                                                            {
                                                              description:
                                                                e.target.value,
                                                            },
                                                          )
                                                        }
                                                        placeholder="Short description"
                                                      />
                                                    </div>
                                                  </div>

                                                  <div className="mt-3 flex items-center justify-between">
                                                    <label className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 bg-white">
                                                      <input
                                                        type="checkbox"
                                                        checked={
                                                          opt.isActive !== false
                                                        }
                                                        onChange={(e) =>
                                                          updateOption(
                                                            pkgIndex,
                                                            groupIndex,
                                                            optionIndex,
                                                            {
                                                              isActive:
                                                                e.target
                                                                  .checked,
                                                            },
                                                          )
                                                        }
                                                      />
                                                      <span className="text-sm font-extrabold text-slate-800">
                                                        Option Active
                                                      </span>
                                                    </label>

                                                    <button
                                                      type="button"
                                                      className="text-red-700 font-extrabold hover:underline"
                                                      onClick={() =>
                                                        removeOption(
                                                          pkgIndex,
                                                          groupIndex,
                                                          optionIndex,
                                                        )
                                                      }
                                                    >
                                                      Remove Option
                                                    </button>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={submitting}
                className={`w-full rounded-2xl py-3 font-extrabold text-white transition ${
                  submitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </span>
                ) : editing ? (
                  "Update Service"
                ) : (
                  "Create Service"
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
