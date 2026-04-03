import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getServiceByIdApi,
  createBookingApi,
  getUserAddressesApi,
  addUserAddressApi,
  getPartnersForServiceBookingApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  markPaymentFailedApi,
} from "../services/api";

import PackageModal from "../components/PackageModal";
import AddressPickerModal from "../components/AddressPickerModal";
import PartnerReviewsCard from "../components/PartnerReviewsCard";

import {
  MapPin,
  CalendarDays,
  Clock,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  Home,
  Plus,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  Wallet,
  Star,
} from "lucide-react";

/* ---------- date helpers ---------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYMDLocal(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}
function getNextDays(count = 3) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
}
function dayLabel(dateObj, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return dateObj.toLocaleDateString(undefined, { weekday: "long" });
}
function niceDate(dateObj) {
  return dateObj.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

/* ---------- helpers ---------- */
function normalizeText(v = "") {
  return String(v).trim().toLowerCase().replace(/\s+/g, " ");
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function uniqAddresses(list = []) {
  const map = new Map();
  for (const a of list) {
    const key = `${normalizeText(a?.label)}|${normalizeText(a?.line1)}`;
    if (!map.has(key)) map.set(key, a);
  }
  return Array.from(map.values());
}

function splitAddress(line1 = "") {
  const parts = String(line1)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) return { head: line1, tail: "" };

  return {
    head: parts.slice(0, 2).join(", "),
    tail: parts.slice(2).join(", "),
  };
}

function statusPill(done) {
  return done
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-gray-50 text-gray-600 border-gray-200";
}

function cardClass(active) {
  return active
    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100 shadow-sm"
    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300";
}

function extractCityFromAddress(addr) {
  if (!addr) return "";

  if (addr.city && String(addr.city).trim()) {
    return String(addr.city).trim();
  }

  const line = String(addr.line1 || "").trim();
  if (!line) return "";

  const parts = line
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!parts.length) return "";

  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0];
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getPartnerImageUrl(partner) {
  const raw =
    partner?.image ||
    partner?.imageUrl ||
    partner?.avatar ||
    partner?.photo ||
    "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `http://localhost:5000${raw}`;
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const serviceId = state?.serviceId;

  const [selectedPkg, setSelectedPkg] = useState(state?.selectedPkg || null);
  const [service, setService] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addressList, setAddressList] = useState([]);
  const [address, setAddress] = useState(null);

  const [slot, setSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const resolvedCity = useMemo(
    () => extractCityFromAddress(address),
    [address],
  );
  const resolvedPincode = useMemo(
    () => String(address?.pincode || "").trim(),
    [address],
  );

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const [pkgOpen, setPkgOpen] = useState(false);
  const [addrPickerOpen, setAddrPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const user = safeParse(localStorage.getItem("user"), null);

  useEffect(() => {
    if (state?.selectedPkg) setSelectedPkg(state.selectedPkg);
  }, [state?.selectedPkg]);

  const dateOptions = useMemo(() => getNextDays(3), []);
  const timeOptions = useMemo(
    () => [
      { label: "09:00 AM", value: "09:00" },
      { label: "11:00 AM", value: "11:00" },
      { label: "01:00 PM", value: "13:00" },
      { label: "03:00 PM", value: "15:00" },
      { label: "05:30 PM", value: "17:30" },
      { label: "07:30 PM", value: "19:30" },
    ],
    [],
  );

  /* load service */
  useEffect(() => {
    if (!serviceId) return;

    (async () => {
      try {
        setLoading(true);
        const sRes = await getServiceByIdApi(serviceId);
        const svc = sRes?.data?.service;
        setService(svc || null);

        const pkgs = svc?.packages || [];
        setPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (e) {
        console.log(e);
        setService(null);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  const refreshAddresses = async () => {
    if (!user?._id) return [];

    try {
      const res = await getUserAddressesApi(user._id);
      const clean = uniqAddresses(res?.data?.addresses || []);
      setAddressList(clean);

      if (address) {
        const stillThere = clean.find(
          (a) =>
            normalizeText(a?.label) === normalizeText(address?.label) &&
            normalizeText(a?.line1) === normalizeText(address?.line1),
        );
        if (!stillThere) setAddress(null);
      }

      return clean;
    } catch (e) {
      console.log("refreshAddresses error:", e);
      setAddressList([]);
      return [];
    }
  };

  useEffect(() => {
    refreshAddresses();
  }, [user?._id]);

  const price = useMemo(
    () =>
      Number(
        selectedPkg?.price ||
          selectedPkg?.packagePrice ||
          selectedPkg?.basePrice ||
          0,
      ),
    [selectedPkg],
  );

  const taxes = useMemo(() => +(price * 0.05).toFixed(2), [price]);
  const total = useMemo(() => +(price + taxes).toFixed(2), [price, taxes]);

  const canBook =
    !!user?._id &&
    !!selectedPkg?.name &&
    !!address?.line1 &&
    !!slot?.date &&
    !!slot?.time &&
    !!paymentMethod &&
    !!selectedPartner?._id;

  const stepDone = {
    pkg: !!selectedPkg?.name,
    addr: !!address?.line1,
    slot: !!slot?.date && !!slot?.time,
    partner: !!selectedPartner?._id,
    pay: !!paymentMethod,
  };

  useEffect(() => {
    const fetchPartners = async () => {
      if (!serviceId || !address?.line1 || !slot?.date || !slot?.time) {
        setPartners([]);
        setSelectedPartner(null);
        return;
      }

      try {
        setPartnersLoading(true);

        const res = await getPartnersForServiceBookingApi(serviceId, {
          city: resolvedCity || "",
          pincode: resolvedPincode || "",
          date: slot?.date || "",
          time: slot?.time || "",
        });

        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setPartners(items);

        setSelectedPartner((prev) => {
          if (!prev?._id) return null;
          const stillExists = items.find(
            (p) => String(p._id) === String(prev._id),
          );
          return stillExists || null;
        });
      } catch (e) {
        console.log("fetchPartners error:", e);
        setPartners([]);
        setSelectedPartner(null);
      } finally {
        setPartnersLoading(false);
      }
    };

    fetchPartners();
  }, [
    serviceId,
    address,
    resolvedCity,
    resolvedPincode,
    slot?.date,
    slot?.time,
  ]);

  const createBooking = async () => {
    if (!canBook || creating) return;

    try {
      setCreating(true);

      const payload = {
        userId: user._id,
        customerName:
          user?.profile?.name || user?.name || user?.fullName || "Customer",
        customerEmail: user?.email || "",
        phone: user?.profile?.phone || user?.phone || "",

        serviceId,
        partnerId: selectedPartner?._id || "",

        packageId: selectedPkg?._id || selectedPkg?.id || "",
        packageName: selectedPkg?.name || "",
        packagePrice: Number(
          selectedPkg?.price || selectedPkg?.packagePrice || 0,
        ),
        basePrice: Number(
          selectedPkg?.basePrice ||
            selectedPkg?.price ||
            selectedPkg?.packagePrice ||
            0,
        ),
        finalPrice: total,
        durationMins: Number(selectedPkg?.durationMins || 0),

        address: {
          label: address?.label || "Home",
          line1: address?.line1 || "",
          houseNo: address?.houseNo || "",
          landmark: address?.landmark || "",
          city: resolvedCity || "",
          state: address?.state || "",
          pincode: resolvedPincode || "",
          lat: address?.lat ?? null,
          lng: address?.lng ?? null,
          source: address?.source || "manual",
        },

        slot: {
          date: slot?.date,
          time: slot?.time,
        },

        paymentMethod,
        notes: "",
      };

      const bookingRes = await createBookingApi(payload);
      const booking = bookingRes?.data?.booking;

      if (!booking?._id) {
        alert("Booking created but bookingId not found");
        return;
      }

      if (paymentMethod !== "Razorpay") {
        navigate("/booking/confirmed", { state: { booking } });
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Razorpay SDK failed to load");
        navigate("/booking/confirmed", { state: { booking } });
        return;
      }

      const orderRes = await createRazorpayOrderApi(booking._id);
      const orderData = orderRes?.data;

      if (!orderData?.order?.id) {
        alert("Failed to create Razorpay order");
        navigate("/booking/confirmed", { state: { booking } });
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Service Finder",
        description: booking?.serviceTitle || "Service Booking Payment",
        order_id: orderData.order.id,

        handler: async function (response) {
          try {
            const verifyRes = await verifyRazorpayPaymentApi({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const updatedBooking = verifyRes?.data?.booking || booking;

            navigate("/booking/confirmed", {
              state: {
                booking: updatedBooking,
              },
            });
          } catch (err) {
            console.log("Payment verify failed:", err);
            alert(
              err?.response?.data?.message || "Payment verification failed",
            );

            navigate("/booking/confirmed", {
              state: { booking },
            });
          }
        },

        prefill: {
          name: booking?.customerName || "",
          email: booking?.customerEmail || "",
          contact: booking?.phone || "",
        },

        notes: {
          bookingId: booking._id,
          partnerId: selectedPartner?._id || "",
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: async function () {
            try {
              await markPaymentFailedApi(booking._id);
            } catch (e) {
              console.log("markPaymentFailed error:", e);
            }

            navigate("/booking/confirmed", {
              state: { booking },
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", async function (response) {
        try {
          await markPaymentFailedApi(booking._id);
        } catch (e) {
          console.log("payment.failed mark error:", e);
        }

        alert(
          response?.error?.description || "Payment failed. Please try again.",
        );

        navigate("/booking/confirmed", {
          state: { booking },
        });
      });

      razorpay.open();
    } catch (e) {
      console.log("Create booking/payment failed:", e);
      alert(e?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!serviceId) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-xl font-extrabold text-gray-900">
            ServiceId missing
          </p>
          <p className="mt-2 text-gray-600">
            Go back and select a service again.
          </p>
          <button
            onClick={() => navigate("/services")}
            className="mt-5 w-full rounded-2xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
          >
            Go to Services
          </button>
        </div>
      </div>
    );
  }

  const serviceImage = (() => {
    const raw = service?.imageUrl || service?.image || service?.thumbnail || "";
    if (!raw) return "";
    return raw.startsWith("http") ? raw : `http://localhost:5000${raw}`;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <ShieldCheck size={16} />
              Verified Experts • Secure Booking
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Confirm your booking
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-600 sm:text-base">
              Service:{" "}
              <span className="font-extrabold text-gray-900">
                {service?.title || "Service"}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { no: 1, label: "Package", done: stepDone.pkg },
              { no: 2, label: "Address", done: stepDone.addr },
              { no: 3, label: "Slot", done: stepDone.slot },
              { no: 4, label: "Partner", done: stepDone.partner },
              { no: 5, label: "Payment", done: stepDone.pay },
            ].map((step) => (
              <div key={step.no} className="flex flex-col items-center gap-2">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-extrabold ${
                    step.done
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}
                >
                  {step.done ? <CheckCircle2 size={18} /> : step.no}
                </div>
                <p
                  className={`text-[11px] font-bold sm:text-sm ${
                    step.done ? "text-indigo-700" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional service image */}
        {serviceImage ? (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="grid items-stretch lg:grid-cols-[1.2fr_.8fr]">
              <div className="overflow-hidden">
                <img
                  src={serviceImage}
                  alt={service?.title || "Service"}
                  className="h-[220px] w-full object-cover object-center sm:h-[260px] lg:h-[300px]"
                  loading="eager"
                />
              </div>

              <div className="hidden flex-col justify-center bg-gradient-to-br from-indigo-50 to-white p-8 lg:flex">
                <p className="text-sm font-semibold text-indigo-600">
                  Selected Service
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                  {service?.title || "Service"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Book verified professionals with transparent pricing, easy
                  scheduling, and secure service at your doorstep.
                </p>

                <div className="mt-5 flex flex-wrap gap-2" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Main layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-5 lg:col-span-2">
            {/* Package */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
                    <BadgeCheck className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">1) Package</p>
                    <p className="text-sm text-gray-600">
                      Choose the best plan for your needs.
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(
                    stepDone.pkg,
                  )}`}
                >
                  {stepDone.pkg ? "Selected" : "Pending"}
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  {selectedPkg ? (
                    <>
                      <p className="text-lg font-extrabold text-gray-900">
                        {selectedPkg.name} • ₹
                        {Number(
                          selectedPkg.price ||
                            selectedPkg.packagePrice ||
                            selectedPkg.basePrice ||
                            0,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Duration: {selectedPkg.durationMins || 60} mins
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">No package selected.</p>
                  )}
                </div>

                <button
                  onClick={() => setPkgOpen(true)}
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-indigo-700"
                >
                  {selectedPkg ? "Change Package" : "View Packages"}
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
                    <MapPin className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">2) Address</p>
                    <p className="text-sm text-gray-600">
                      Select your service location.
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(
                    stepDone.addr,
                  )}`}
                >
                  {stepDone.addr ? "Selected" : "Pending"}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {address ? (
                  (() => {
                    const { head, tail } = splitAddress(address.line1);
                    return (
                      <div className="flex items-start justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                        <div>
                          <p className="flex items-center gap-2 font-extrabold text-gray-900">
                            <Home size={16} className="text-indigo-600" />
                            {address.label || "Address"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {head}
                          </p>
                          {tail ? (
                            <p className="mt-1 text-xs text-gray-600">{tail}</p>
                          ) : null}
                          {address?.pincode ? (
                            <p className="mt-1 text-xs text-gray-500">
                              Pincode: {address.pincode}
                            </p>
                          ) : null}
                        </div>

                        <button
                          onClick={() => setAddrPickerOpen(true)}
                          className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
                        >
                          Change
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-gray-600">
                    No address selected.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {addressList.map((a, i) => {
                    const active =
                      normalizeText(address?.label) ===
                        normalizeText(a?.label) &&
                      normalizeText(address?.line1) === normalizeText(a?.line1);

                    const { head, tail } = splitAddress(a?.line1 || "");

                    return (
                      <button
                        key={`${a?.label || "addr"}-${a?.line1 || i}`}
                        onClick={() => setAddress(a)}
                        className={`rounded-2xl border p-4 text-left transition-all ${cardClass(
                          active,
                        )}`}
                      >
                        <p className="flex items-center gap-2 font-extrabold text-gray-900">
                          <MapPin
                            size={16}
                            className={
                              active ? "text-indigo-600" : "text-gray-500"
                            }
                          />
                          {a.label || "Home"}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          {head}
                        </p>
                        {tail ? (
                          <p className="mt-1 text-xs text-gray-600">{tail}</p>
                        ) : null}
                        {a?.pincode ? (
                          <p className="mt-2 text-xs text-gray-500">
                            Pincode: {a.pincode}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      const line1 = prompt(
                        "Enter address (House, Road, Area, City - Pincode)",
                      );
                      if (!line1 || !user?._id) return;

                      try {
                        const r = await addUserAddressApi(user._id, {
                          label: "Home",
                          line1,
                          source: "manual",
                        });

                        const clean = uniqAddresses(r?.data?.addresses || []);
                        setAddressList(clean);

                        const latest = clean[clean.length - 1];
                        if (latest) setAddress(latest);
                      } catch (e) {
                        console.log("Add address failed:", e);
                        alert(
                          e?.response?.data?.message ||
                            "Failed to save address. Please try again.",
                        );
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-800 hover:bg-gray-50"
                  >
                    <Plus size={16} />
                    Add Address
                  </button>

                  <button
                    onClick={() => setAddrPickerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700"
                  >
                    <MapPin size={16} />
                    Use Live Location
                  </button>
                </div>
              </div>
            </div>

            {/* Slot */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
                    <CalendarDays className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">3) Slot</p>
                    <p className="text-sm text-gray-600">
                      Pick a day and time.
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(
                    stepDone.slot,
                  )}`}
                >
                  {stepDone.slot ? "Selected" : "Pending"}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {dateOptions.map((dObj, idx) => {
                    const ymd = toYMDLocal(dObj);
                    const active = slot?.date === ymd;

                    return (
                      <button
                        key={ymd}
                        onClick={() =>
                          setSlot((prev) => ({ ...(prev || {}), date: ymd }))
                        }
                        className={`rounded-2xl border p-4 text-left transition-all ${cardClass(
                          active,
                        )}`}
                      >
                        <p
                          className={`text-sm font-extrabold ${
                            active ? "text-indigo-700" : "text-gray-900"
                          }`}
                        >
                          {dayLabel(dObj, idx)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {niceDate(dObj)}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                    <Clock size={16} className="text-indigo-600" />
                    Time
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {timeOptions.map((t) => {
                      const active = slot?.time === t.value;
                      const disabled = !slot?.date;

                      return (
                        <button
                          key={t.value}
                          disabled={disabled}
                          onClick={() =>
                            setSlot((prev) => ({
                              ...(prev || {}),
                              time: t.value,
                            }))
                          }
                          className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                            disabled
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : active
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Partner */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
                    <ShieldCheck className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">
                      4) Select Partner
                    </p>
                    <p className="text-sm text-gray-600">
                      Choose your preferred service partner and check real user
                      reviews.
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(
                    stepDone.partner,
                  )}`}
                >
                  {stepDone.partner ? "Selected" : "Pending"}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {!address?.line1 || !slot?.date || !slot?.time ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                    Select address and slot first to view available partners.
                  </div>
                ) : partnersLoading ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-600">
                    Loading matching partners...
                  </div>
                ) : partners.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    No matching partners found for this service, location, and
                    selected slot.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {partners.map((partner) => {
                          const active =
                            String(selectedPartner?._id || "") ===
                            String(partner?._id || "");

                          const partnerImage = getPartnerImageUrl(partner);
                          const rating = Number(
                            partner?.averageRating || partner?.rating || 0,
                          );

                          return (
                            <button
                              key={partner._id}
                              type="button"
                              onClick={() =>
                                partner.isAvailable &&
                                setSelectedPartner(partner)
                              }
                              disabled={!partner.isAvailable}
                              className={`rounded-2xl border p-4 text-left transition-all ${
                                !partner.isAvailable
                                  ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-70"
                                  : cardClass(active)
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-indigo-50">
                                  {partnerImage ? (
                                    <img
                                      src={partnerImage}
                                      alt={partner?.name || "Partner"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-sm font-extrabold text-indigo-700">
                                      {getInitials(partner?.name || "Partner")}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-extrabold text-gray-900">
                                    {partner?.name || "Partner"}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-600">
                                    {partner?.city || "City not available"}
                                  </p>

                                  {partner?.phone ? (
                                    <p className="mt-1 text-xs text-gray-500">
                                      {partner.phone}
                                    </p>
                                  ) : null}

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {partner?.experienceYears ? (
                                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                        {partner.experienceYears} yrs exp
                                      </span>
                                    ) : null}

                                    {rating > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                        <Star size={12} className="fill-current" />
                                        {rating.toFixed(1)} rating
                                      </span>
                                    ) : null}

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                        partner?.isAvailable
                                          ? "bg-green-50 text-green-700"
                                          : "bg-red-50 text-red-700"
                                      }`}
                                    >
                                      {partner?.isAvailable
                                        ? "Available"
                                        : "Unavailable"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedPartner ? (
                        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                          <p className="font-extrabold text-indigo-900">
                            Selected Partner: {selectedPartner?.name}
                          </p>
                          <p className="mt-1 text-sm text-indigo-700">
                            {selectedPartner?.city || "City not available"}
                            {selectedPartner?.phone
                              ? ` • ${selectedPartner.phone}`
                              : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <PartnerReviewsCard partner={selectedPartner} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
                    <CreditCard className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">5) Payment</p>
                    <p className="text-sm text-gray-600">
                      Choose payment method.
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  Available
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setPaymentMethod("Cash")}
                    className={`rounded-2xl border px-5 py-4 text-left font-extrabold transition ${
                      paymentMethod === "Cash"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Cash on Service
                    <p
                      className={`mt-1 text-xs font-medium ${
                        paymentMethod === "Cash"
                          ? "text-indigo-100"
                          : "text-gray-500"
                      }`}
                    >
                      Pay after service completion
                    </p>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("Razorpay")}
                    className={`rounded-2xl border px-5 py-4 text-left font-extrabold transition ${
                      paymentMethod === "Razorpay"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet size={18} />
                      Razorpay
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        paymentMethod === "Razorpay"
                          ? "text-indigo-100"
                          : "text-gray-500"
                      }`}
                    >
                      Pay now using test payment gateway
                    </p>
                  </button>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Test mode only. Real payment is not required.
                </p>
              </div>
            </div>

            {/* Desktop confirm */}
            <div className="hidden lg:block">
              <button
                disabled={!canBook || creating}
                onClick={createBooking}
                className={`w-full rounded-2xl py-4 text-lg font-extrabold text-white transition ${
                  canBook && !creating
                    ? "bg-indigo-600 shadow-sm hover:bg-indigo-700"
                    : "cursor-not-allowed bg-gray-300"
                }`}
              >
                {creating
                  ? "Booking..."
                  : paymentMethod === "Razorpay"
                    ? "Confirm & Pay"
                    : "Confirm Booking"}
              </button>

              {!user?._id ? (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  You must sign in before booking.
                </p>
              ) : null}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
                    <Receipt size={18} className="text-indigo-600" />
                    Summary
                  </p>
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    Secure
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Service</span>
                    <span className="text-right font-semibold text-gray-900">
                      {service?.title || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Package</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPkg?.name || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Slot</span>
                    <span className="text-right font-semibold text-gray-900">
                      {slot?.date
                        ? `${slot.date}${slot?.time ? ` • ${slot.time}` : ""}`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Partner</span>
                    <span className="text-right font-semibold text-gray-900">
                      {selectedPartner?.name || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Payment</span>
                    <span className="text-right font-semibold text-gray-900">
                      {paymentMethod || "-"}
                    </span>
                  </div>

                  <div className="my-3 h-px bg-gray-100" />

                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-semibold text-gray-900">
                      ₹{price}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes (5%)</span>
                    <span className="font-semibold text-gray-900">
                      ₹{taxes}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        Total Payable
                      </span>
                      <span className="text-2xl font-extrabold text-indigo-700">
                        ₹{total}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="flex items-center gap-2 font-extrabold text-green-800">
                      <ShieldCheck size={16} />
                      100% Verified Partners
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Safe booking • Trusted service • Support available
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="font-extrabold text-gray-900">Need help?</p>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50">
                    <PhoneCall size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      +91 8866807245
                    </p>
                    <p className="text-xs text-gray-500">
                      Mon–Sat, 9 AM – 7 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional duplicate review panel on right summary area for desktop only */}
              {selectedPartner ? (
                <div className="hidden lg:block">
                  <PartnerReviewsCard partner={selectedPartner} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {!user?._id ? (
          <p className="mt-4 text-sm font-semibold text-red-600 lg:hidden">
            You must sign in before booking.
          </p>
        ) : null}
      </div>

      {/* Mobile sticky confirm */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-500">Total</p>
            <p className="truncate text-xl font-extrabold text-indigo-700">
              ₹{total}
            </p>
          </div>

          <button
            disabled={!canBook || creating}
            onClick={createBooking}
            className={`rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition ${
              canBook && !creating
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {creating
              ? "Booking..."
              : paymentMethod === "Razorpay"
                ? "Confirm & Pay"
                : "Confirm Booking"}
          </button>
        </div>
      </div>

      {/* Package modal */}
      <PackageModal
        open={pkgOpen}
        setOpen={setPkgOpen}
        selectedService={{
          ...(service || {}),
          packages,
        }}
        redirectToBooking={false}
        onSelect={(pkg) => {
          setSelectedPkg(pkg);
          setPkgOpen(false);
        }}
      />

      {/* Address picker modal */}
      <AddressPickerModal
        open={addrPickerOpen}
        setOpen={setAddrPickerOpen}
        onConfirm={async (addrObj) => {
          if (!user?._id) return;

          try {
            const payload = {
              ...addrObj,
              label: "Current Location",
              source: "live",
              lat: addrObj?.lat ?? null,
              lng: addrObj?.lng ?? null,
            };

            const existing = addressList.find(
              (a) =>
                normalizeText(a?.label) === "current location" ||
                a?.source === "live",
            );

            if (existing) {
              const updatedList = addressList.map((a) =>
                normalizeText(a?.label) === "current location" ||
                a?.source === "live"
                  ? { ...a, ...payload }
                  : a,
              );

              const clean = uniqAddresses(updatedList);
              setAddressList(clean);
              setAddress({ ...existing, ...payload });
              setAddrPickerOpen(false);
              return;
            }

            const r = await addUserAddressApi(user._id, payload);
            const clean = uniqAddresses(r?.data?.addresses || []);
            setAddressList(clean);

            const liveAddr =
              clean.find(
                (a) =>
                  normalizeText(a?.label) === "current location" ||
                  a?.source === "live",
              ) || clean[clean.length - 1];

            if (liveAddr) setAddress(liveAddr);
            setAddrPickerOpen(false);
          } catch (e) {
            console.log("Live address save failed:", e);
            alert(
              e?.response?.data?.message ||
                "Failed to save live location. Please try again.",
            );
          }
        }}
      />
    </div>
  );
}