import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPackagesByServiceApi } from "../services/api";
import {
  X,
  Check,
  Loader2,
  Sparkles,
  Clock3,
  ArrowRight,
  Plus,
  Minus,
  ShieldCheck,
  BadgeCheck,
  Crown,
  Star,
  CheckCircle2,
} from "lucide-react";

export default function PackageModal({
  open,
  setOpen,
  selectedService,
  redirectToBooking = true,
  onSelect,
}) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [apiPkgs, setApiPkgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePkgKey, setActivePkgKey] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  const close = () => setOpen(false);

  const memoPkgs = useMemo(() => {
    const arr = selectedService?.packages || [];
    if (!Array.isArray(arr)) return [];
    return [...arr].sort(
      (a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0)
    );
  }, [selectedService]);

  const pkgs = useMemo(() => {
    const list = apiPkgs?.length ? apiPkgs : memoPkgs;
    return Array.isArray(list) ? list : [];
  }, [apiPkgs, memoPkgs]);

  const activePkg = useMemo(() => {
    if (!pkgs.length) return null;
    return (
      pkgs.find((p) => (p?._id || p?.name) === activePkgKey) || pkgs[0] || null
    );
  }, [pkgs, activePkgKey]);

  const optionGroups = useMemo(() => {
    return Array.isArray(activePkg?.optionGroups) ? activePkg.optionGroups : [];
  }, [activePkg]);

  const normalizePkg = (pkg) => {
    return {
      ...pkg,
      name: pkg?.name || pkg?.title || pkg?.packageName || "Selected Package",
      basePrice:
        Number(pkg?.basePrice ?? pkg?.price ?? pkg?.amount ?? pkg?.cost ?? 0) ||
        0,
      durationMins: Number(pkg?.durationMins || 0) || 0,
    };
  };

  const getGroupId = (group, index) =>
    group?._id || group?.name || `group-${index}`;
  const getOptionId = (opt, index) =>
    opt?._id || opt?.label || `option-${index}`;

  const initializeSelections = (pkg) => {
    const groups = Array.isArray(pkg?.optionGroups) ? pkg.optionGroups : [];
    const initial = {};

    groups.forEach((group, groupIndex) => {
      const groupId = getGroupId(group, groupIndex);
      const options = Array.isArray(group?.options) ? group.options : [];
      const activeOptions = options.filter((opt) => opt?.isActive !== false);

      if (!activeOptions.length) {
        initial[groupId] = group?.type === "multiple" ? [] : null;
        return;
      }

      if (group?.type === "multiple") {
        initial[groupId] = [];
      } else {
        initial[groupId] = group?.isRequired
          ? activeOptions[0]?._id || activeOptions[0]?.label || null
          : null;
      }
    });

    setSelectedOptions(initial);
  };

  const isRecommended = (p, idx) => {
    const nm = String(p?.name || "").toLowerCase();
    return (
      p?.isRecommended === true ||
      nm === "standard" ||
      nm === "classic" ||
      Number(p?.sortOrder ?? idx) === 1
    );
  };

  const toggleOption = (group, option, groupIndex, optionIndex) => {
    if (option?.isActive === false) return;

    const groupId = getGroupId(group, groupIndex);
    const optionId = getOptionId(option, optionIndex);

    setSelectedOptions((prev) => {
      const next = { ...prev };

      if (group?.type === "multiple") {
        const prevArr = Array.isArray(next[groupId]) ? next[groupId] : [];
        const exists = prevArr.includes(optionId);

        next[groupId] = exists
          ? prevArr.filter((id) => id !== optionId)
          : [...prevArr, optionId];
      } else {
        next[groupId] = optionId;
      }

      return next;
    });
  };

  const isOptionSelected = (group, option, groupIndex, optionIndex) => {
    const groupId = getGroupId(group, groupIndex);
    const optionId = getOptionId(option, optionIndex);
    const val = selectedOptions[groupId];

    if (group?.type === "multiple") {
      return Array.isArray(val) && val.includes(optionId);
    }

    return val === optionId;
  };

  const selectedOptionObjects = useMemo(() => {
    const output = [];

    optionGroups.forEach((group, groupIndex) => {
      const groupId = getGroupId(group, groupIndex);
      const options = Array.isArray(group?.options) ? group.options : [];
      const selected = selectedOptions[groupId];

      if (group?.type === "multiple") {
        const arr = Array.isArray(selected) ? selected : [];
        arr.forEach((selectedId) => {
          const found = options.find(
            (opt, idx) => getOptionId(opt, idx) === selectedId
          );
          if (found) {
            output.push({
              groupId,
              groupName: group?.name || "Options",
              ...found,
            });
          }
        });
      } else {
        const found = options.find(
          (opt, idx) => getOptionId(opt, idx) === selected
        );
        if (found) {
          output.push({
            groupId,
            groupName: group?.name || "Options",
            ...found,
          });
        }
      }
    });

    return output;
  }, [optionGroups, selectedOptions]);

  const totalPrice = useMemo(() => {
    if (!activePkg) return 0;

    const base =
      Number(
        activePkg?.basePrice ??
          activePkg?.price ??
          activePkg?.amount ??
          activePkg?.cost ??
          0
      ) || 0;

    const extra = selectedOptionObjects.reduce((sum, item) => {
      return sum + (Number(item?.price || 0) || 0);
    }, 0);

    return base + extra;
  }, [activePkg, selectedOptionObjects]);

  const missingRequiredGroups = useMemo(() => {
    return optionGroups.filter((group, groupIndex) => {
      if (!group?.isRequired) return false;

      const groupId = getGroupId(group, groupIndex);
      const value = selectedOptions[groupId];

      if (group?.type === "multiple") {
        return !Array.isArray(value) || value.length === 0;
      }

      return !value;
    });
  }, [optionGroups, selectedOptions]);

  const canContinue =
    !!activePkg &&
    activePkg?.isActive !== false &&
    missingRequiredGroups.length === 0;

  const handleContinue = () => {
    if (!activePkg || activePkg?.isActive === false) return;
    if (missingRequiredGroups.length > 0) return;

    const normalizedPkg = normalizePkg(activePkg);

    const finalSelection = {
      ...normalizedPkg,
      selectedOptions,
      selectedOptionObjects,
      finalPrice: totalPrice,
    };

    if (redirectToBooking) {
      if (!selectedService?._id) {
        alert("Service not found. Please select service again.");
        return;
      }

      navigate("/booking", {
        state: {
          serviceId: selectedService._id,
          selectedPkg: finalSelection,
        },
      });
      close();
      return;
    }

    onSelect?.(finalSelection);
    close();
  };

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const serviceId = selectedService?._id;
    if (!serviceId) {
      setApiPkgs([]);
      setActivePkgKey(null);
      setSelectedOptions({});
      return;
    }

    setLoading(true);
    setError("");

    getPackagesByServiceApi(serviceId)
      .then((res) => {
        const data = res?.data;
        const arr = Array.isArray(data) ? data : data?.packages || [];
        const list = Array.isArray(arr) ? [...arr] : [];

        list.sort(
          (a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0)
        );

        setApiPkgs(list);

        const defaultPkg =
          list.find((p) => String(p?.name || "").toLowerCase() === "standard") ||
          list.find((p) => p?.isRecommended === true) ||
          list.find((p) => p?.isActive !== false) ||
          list[0] ||
          null;

        const key = defaultPkg?._id || defaultPkg?.name || null;
        setActivePkgKey(key);

        if (defaultPkg) {
          initializeSelections(defaultPkg);
        } else {
          setSelectedOptions({});
        }
      })
      .catch((e) => {
        console.log("Packages fetch error:", e);
        setApiPkgs([]);
        setError("Failed to load packages. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [open, selectedService?._id]);

  useEffect(() => {
    if (!activePkg) {
      setSelectedOptions({});
      return;
    }
    initializeSelections(activePkg);
  }, [activePkgKey]);

  if (!open) return null;

  const title = selectedService?.title || "Service Packages";

  const serviceImage = (() => {
    const raw =
      selectedService?.imageUrl ||
      selectedService?.image ||
      selectedService?.thumbnail ||
      "";
    if (!raw) return "";
    if (raw.startsWith("http")) return raw;
    const base = (
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    return `${base}${raw}`;
  })();

  const basePackagePrice =
    Number(
      activePkg?.basePrice ??
        activePkg?.price ??
        activePkg?.amount ??
        activePkg?.cost ??
        0
    ) || 0;

  const startingPrice = pkgs.length
    ? Math.min(
        ...pkgs.map(
          (p) =>
            Number(p?.basePrice ?? p?.price ?? p?.amount ?? p?.cost ?? 0) || 0
        )
      )
    : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={close}
        aria-label="Close"
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-7xl max-h-[96vh] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Sparkles size={13} />
                Package selection
              </div>

              <h2 className="truncate text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose the best package and customize your service experience
              </p>
            </div>

            <button
              onClick={close}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(96vh-88px)] overflow-y-auto">
          {loading ? (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-700">
                <Loader2 size={18} className="animate-spin" />
                <span className="font-semibold">Loading packages...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 sm:p-8">
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                <p className="font-black">Something went wrong</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          ) : pkgs.length === 0 ? (
            <div className="p-6 sm:p-8">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-700">
                No packages available for this service.
              </div>
            </div>
          ) : (
            <>
              {/* service top strip */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                      {serviceImage ? (
                        <img
                          src={serviceImage}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-50 to-gray-100 text-sm font-black text-gray-500">
                          SF
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        Selected Service
                      </p>
                      <h3 className="truncate text-xl font-black text-gray-900 sm:text-2xl">
                        {title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <ShieldCheck size={13} />
                          Verified professionals
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          <BadgeCheck size={13} />
                          Quality checked
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                          <Star size={13} />
                          Premium service
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-200 bg-white px-5 py-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                      Starting from
                    </p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-gray-900">
                      ₹{startingPrice}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                {/* Left package list */}
                <aside className="border-b border-gray-200 bg-gray-50 p-4 sm:p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                      Choose package
                    </p>
                    <h4 className="mt-1 text-lg font-black text-gray-900">
                      Available plans
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {pkgs.map((p, idx) => {
                      const key = p?._id || p?.name || `pkg-${idx}`;
                      const selected = key === activePkgKey;
                      const name =
                        p?.name || p?.title || p?.packageName || `Package ${idx + 1}`;
                      const price = Number(
                        p?.basePrice ?? p?.price ?? p?.amount ?? p?.cost ?? 0
                      );
                      const inactive = p?.isActive === false;
                      const rec = isRecommended(p, idx);
                      const duration = Number(p?.durationMins || 0);

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={inactive}
                          onClick={() => {
                            if (inactive) return;
                            setActivePkgKey(key);
                          }}
                          className={[
                            "group relative w-full overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200",
                            selected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:shadow-sm",
                            inactive ? "cursor-not-allowed opacity-50" : "",
                          ].join(" ")}
                        >
                          {rec ? (
                            <div
                              className={[
                                "mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
                                selected
                                  ? "border border-amber-200 bg-amber-100 text-amber-700"
                                  : "border border-amber-200 bg-amber-50 text-amber-700",
                              ].join(" ")}
                            >
                              <Crown size={12} />
                              Most Popular
                            </div>
                          ) : null}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={[
                                  "truncate text-base font-black",
                                  selected ? "text-blue-700" : "text-gray-900",
                                ].join(" ")}
                              >
                                {name}
                              </p>
                              <p
                                className={[
                                  "mt-1 text-xs",
                                  selected ? "text-blue-600" : "text-gray-500",
                                ].join(" ")}
                              >
                                {duration ? `${duration} mins` : "Flexible duration"}
                              </p>
                            </div>

                            <div
                              className={[
                                "grid h-8 w-8 place-items-center rounded-xl border",
                                selected
                                  ? "border-blue-500 bg-blue-500 text-white"
                                  : "border-gray-200 bg-gray-50 text-transparent",
                              ].join(" ")}
                            >
                              <Check size={15} />
                            </div>
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <p
                                className={[
                                  "text-2xl font-black tracking-tight",
                                  selected ? "text-blue-700" : "text-gray-900",
                                ].join(" ")}
                              >
                                ₹{price}
                              </p>
                              <p
                                className={[
                                  "text-[11px] font-semibold",
                                  selected ? "text-blue-600" : "text-gray-500",
                                ].join(" ")}
                              >
                                Final price may change with add-ons
                              </p>
                            </div>

                            {!inactive && !selected ? (
                              <span className="text-xs font-bold text-blue-600">
                                Select
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* Right content */}
                <section className="bg-white p-4 sm:p-6">
                  {activePkg ? (
                    <>
                      {/* selected package hero */}
                      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                        <div className="p-5 sm:p-7">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                              <div className="mb-3 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                  <Sparkles size={12} />
                                  Selected package
                                </span>
                                {isRecommended(activePkg, 0) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                    <Crown size={12} />
                                    Best value
                                  </span>
                                ) : null}
                              </div>

                              <h3 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                                {activePkg?.name || "Selected Package"}
                              </h3>

                              {activePkg?.description ? (
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                                  {activePkg.description}
                                </p>
                              ) : (
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                                  Professionally curated package designed for a smooth,
                                  reliable and premium service experience.
                                </p>
                              )}

                              <div className="mt-5 flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                                  <Clock3 size={15} />
                                  {Number(activePkg?.durationMins || 0)
                                    ? `${Number(activePkg?.durationMins)} mins`
                                    : "Duration flexible"}
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                                  <ShieldCheck size={15} />
                                  Trusted service standard
                                </div>
                              </div>
                            </div>

                            <div className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                Total price
                              </p>
                              <p className="mt-1 text-4xl font-black tracking-tight text-blue-700">
                                ₹{totalPrice}
                              </p>
                              <p className="mt-1 text-xs text-blue-600">
                                Includes selected customizations
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* features */}
                      {Array.isArray(activePkg?.features) &&
                      activePkg.features.length > 0 ? (
                        <div className="mt-6 rounded-[28px] border border-gray-200 bg-gray-50 p-5 sm:p-6">
                          <div className="mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-600" size={18} />
                            <h4 className="text-lg font-black text-gray-900">
                              What’s included
                            </h4>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            {activePkg.features.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3"
                              >
                                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                                  <Check size={15} />
                                </span>
                                <span className="text-sm leading-6 text-gray-700">
                                  {f}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* options */}
                      <div className="mt-6 space-y-6">
                        {optionGroups.length > 0 ? (
                          optionGroups.map((group, groupIndex) => {
                            const groupId = getGroupId(group, groupIndex);
                            const options = Array.isArray(group?.options)
                              ? group.options
                              : [];

                            return (
                              <div
                                key={groupId}
                                className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                              >
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-xl font-black text-gray-900">
                                        {group?.name || `Group ${groupIndex + 1}`}
                                      </h4>

                                      {group?.isRequired ? (
                                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700">
                                          Required
                                        </span>
                                      ) : (
                                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-black text-gray-600">
                                          Optional
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-1 text-sm text-gray-500">
                                      {group?.type === "multiple"
                                        ? "Choose one or more add-ons for a personalized service."
                                        : "Choose the option that fits your requirement best."}
                                    </p>
                                  </div>

                                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                    {group?.type === "multiple"
                                      ? "Multiple selection"
                                      : "Single selection"}
                                  </div>
                                </div>

                                {options.length === 0 ? (
                                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                                    No options added yet.
                                  </div>
                                ) : (
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {options.map((opt, optionIndex) => {
                                      const selected = isOptionSelected(
                                        group,
                                        opt,
                                        groupIndex,
                                        optionIndex
                                      );
                                      const inactive = opt?.isActive === false;
                                      const extraPrice =
                                        Number(opt?.price || 0) || 0;

                                      return (
                                        <button
                                          key={getOptionId(opt, optionIndex)}
                                          type="button"
                                          disabled={inactive}
                                          onClick={() =>
                                            toggleOption(
                                              group,
                                              opt,
                                              groupIndex,
                                              optionIndex
                                            )
                                          }
                                          className={[
                                            "group relative w-full overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200",
                                            selected
                                              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-100"
                                              : "border-gray-200 bg-white hover:shadow-sm",
                                            inactive ? "cursor-not-allowed opacity-50" : "",
                                          ].join(" ")}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <p className="text-base font-black text-gray-900">
                                                {opt?.label ||
                                                  opt?.name ||
                                                  `Option ${optionIndex + 1}`}
                                              </p>

                                              {opt?.description ? (
                                                <p className="mt-1 text-sm leading-6 text-gray-500">
                                                  {opt.description}
                                                </p>
                                              ) : (
                                                <p className="mt-1 text-sm leading-6 text-gray-400">
                                                  Premium customization option for your service.
                                                </p>
                                              )}
                                            </div>

                                            <div
                                              className={[
                                                "grid h-9 w-9 shrink-0 place-items-center rounded-2xl border transition",
                                                selected
                                                  ? "border-blue-600 bg-blue-600 text-white"
                                                  : "border-gray-200 bg-gray-50 text-transparent",
                                              ].join(" ")}
                                            >
                                              <Check size={16} />
                                            </div>
                                          </div>

                                          <div className="mt-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base font-black text-gray-900">
                                                {extraPrice > 0
                                                  ? `+ ₹${extraPrice}`
                                                  : "Included"}
                                              </span>
                                            </div>

                                            {group?.type === "multiple" ? (
                                              <div
                                                className={[
                                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black",
                                                  selected
                                                    ? "border-blue-200 bg-blue-100 text-blue-700"
                                                    : "border-gray-200 bg-gray-50 text-gray-600",
                                                ].join(" ")}
                                              >
                                                {selected ? (
                                                  <>
                                                    <Minus size={13} />
                                                    Added
                                                  </>
                                                ) : (
                                                  <>
                                                    <Plus size={13} />
                                                    Add
                                                  </>
                                                )}
                                              </div>
                                            ) : (
                                              <span
                                                className={[
                                                  "text-xs font-bold",
                                                  selected
                                                    ? "text-blue-700"
                                                    : "text-gray-500",
                                                ].join(" ")}
                                              >
                                                {selected ? "Selected" : "Tap to select"}
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                            No customization options added for this package yet.
                          </div>
                        )}
                      </div>

                      {/* summary */}
                      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5 sm:p-6">
                          <p className="text-lg font-black text-gray-900">
                            Selection summary
                          </p>

                          <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Base Package</span>
                              <span className="font-black text-gray-900">
                                ₹{basePackagePrice}
                              </span>
                            </div>

                            {selectedOptionObjects.length > 0 ? (
                              selectedOptionObjects.map((item, idx) => (
                                <div
                                  key={`${item?.groupId}-${item?._id || item?.label || idx}`}
                                  className="flex items-center justify-between gap-4 text-sm"
                                >
                                  <span className="text-gray-600">
                                    {item?.groupName}: {item?.label || item?.name}
                                  </span>
                                  <span className="whitespace-nowrap font-bold text-gray-900">
                                    {Number(item?.price || 0) > 0
                                      ? `₹${Number(item?.price || 0)}`
                                      : "Included"}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">
                                No extra options selected yet.
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                              <span className="text-base font-black text-gray-900">
                                Final Total
                              </span>
                              <span className="text-3xl font-black tracking-tight text-gray-900">
                                ₹{totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-gray-200 bg-white p-5 text-gray-900 shadow-sm sm:p-6">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                            Current selection
                          </p>
                          <h4 className="mt-2 text-2xl font-black tracking-tight">
                            {activePkg?.name || "Package"}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Carefully selected package with professional quality assurance.
                          </p>

                          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                              Payable amount
                            </p>
                            <p className="mt-1 text-4xl font-black tracking-tight text-blue-700">
                              ₹{totalPrice}
                            </p>
                          </div>

                          <div className="mt-6 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Check size={15} className="text-emerald-500" />
                              Transparent pricing
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={15} className="text-emerald-500" />
                              Trusted service delivery
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={15} className="text-emerald-500" />
                              Easy customization
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3">
                            <button
                              onClick={handleContinue}
                              disabled={!canContinue}
                              className={[
                                "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black transition",
                                canContinue
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "cursor-not-allowed bg-gray-200 text-gray-500",
                              ].join(" ")}
                            >
                              Continue to booking <ArrowRight size={17} />
                            </button>

                            <button
                              onClick={close}
                              className="rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>

                      {missingRequiredGroups.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Please select required option(s):{" "}
                          <span className="font-black">
                            {missingRequiredGroups
                              .map((g) => g?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-6 text-gray-600">
                      Please select a package.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}