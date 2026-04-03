import React, { useEffect, useMemo, useState } from "react";
import { submitJoinUsApi, getPublicServicesApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  ShieldCheck,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Phone,
  Mail,
  CalendarDays,
  Building2,
  Wrench,
  MapPin,
} from "lucide-react";

const GUJARAT_COLLEGES = [
  "IIT Gandhinagar",
  "DAIICT Gandhinagar",
  "Nirma University",
  "CEPT University",
  "Gujarat University",
  "Gujarat Technological University (GTU)",
  "MS University Baroda",
  "Charotar University (CHARUSAT)",
  "Parul University",
  "Silver Oak University",
  "Ganpat University",
  "Navrachana University",
  "Indus University",
  "RK University",
  "Marwadi University",
  "Uka Tarsadia University",
  "Anand Agricultural University",
  "birla vishvakarma mahavidyalaya(BVM)",
  "Other",
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

const steps = [
  {
    key: "basic",
    title: "Basic Details",
    icon: User,
    desc: "Personal information",
  },
  {
    key: "education",
    title: "Education",
    icon: GraduationCap,
    desc: "Academic background",
  },
  {
    key: "professional",
    title: "Professional",
    icon: Briefcase,
    desc: "Experience & skills",
  },
  {
    key: "services",
    title: "Services & Area",
    icon: Wrench,
    desc: "Service, address and schedule",
  },
];

const inputBase =
  "w-full rounded-2xl border border-white/50 bg-white/80 backdrop-blur px-4 py-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

const labelBase =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600";

const cardBase =
  "rounded-[28px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.10)]";

const createDefaultWorkingSlots = () =>
  WEEK_DAYS.map((day) => ({
    day,
    startTime: "09:00",
    endTime: "18:00",
    isAvailable: day !== "Sunday",
  }));

export default function Clickjoinus() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "male",
    email: "",
    dob: "",
    city: "",
    addressLine1: "",
    pincode: "",
    degree: "",
    institute: "",
    customInstitute: "",
    passingYear: "",
    experienceYears: "",
    currentRole: "",
    about: "",
    skills: "",
    serviceIds: [],
  });

  const [document, setDocument] = useState(null);
  const [services, setServices] = useState([]);
  const [workingSlots, setWorkingSlots] = useState(createDefaultWorkingSlots());

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const onChange = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

  const sanitizePincode = (value) => value.replace(/\D/g, "").slice(0, 6);

  const selectedServiceNames = useMemo(() => {
    return services
      .filter((s) => form.serviceIds.includes(s._id))
      .map((s) => s.title);
  }, [services, form.serviceIds]);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const profile = user?.profile || {};

    setForm((prev) => ({
      ...prev,
      fullName: profile.name || user?.name || user?.fullName || "",
      phone: profile.phone || user?.phone || "",
      email: user?.email || "",
      city: profile.city || user?.city || "",
      gender: profile.gender || user?.gender || "male",
    }));
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);

        const res = await getPublicServicesApi({ page: 1, limit: 500 });
        const raw = res?.data?.items || res?.data?.services || res?.data || [];
        const list = Array.isArray(raw) ? raw : [];

        setServices(list.filter((s) => s?.isActive !== false));
      } catch (error) {
        console.error("Failed to load services:", error);
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  const resetForm = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const profile = user?.profile || {};

    setForm({
      fullName: profile.name || user?.name || user?.fullName || "",
      phone: profile.phone || user?.phone || "",
      gender: profile.gender || user?.gender || "male",
      email: user?.email || "",
      dob: "",
      city: profile.city || user?.city || "",
      addressLine1: "",
      pincode: "",
      degree: "",
      institute: "",
      customInstitute: "",
      passingYear: "",
      experienceYears: "",
      currentRole: "",
      about: "",
      skills: "",
      serviceIds: [],
    });

    setWorkingSlots(createDefaultWorkingSlots());
    setDocument(null);
    setStep(0);
    setErr("");
    setMsg("");
  };

  const toggleService = (serviceId) => {
    setForm((prev) => {
      const exists = prev.serviceIds.includes(serviceId);

      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
  };

  const updateWorkingSlot = (day, key, value) => {
    setWorkingSlots((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, [key]: value } : slot
      )
    );
  };

  const validateStep = () => {
    setErr("");
    setMsg("");

    if (step === 0) {
      if (!form.fullName.trim()) return "Full Name is required";
      if (!form.phone.trim()) return "Phone is required";
      if (form.phone.trim().length !== 10) {
        return "Enter valid 10-digit phone number";
      }
      if (!form.email.trim()) return "Email is required";
      if (!form.dob.trim()) return "DOB is required";
      if (!form.city.trim()) return "City is required";
    }

    if (step === 1) {
      if (form.institute === "Other" && !form.customInstitute.trim()) {
        return "Please enter your institute name";
      }
      if (form.passingYear && !/^\d{4}$/.test(form.passingYear)) {
        return "Passing Year must be 4 digits (ex: 2026)";
      }
    }

    if (step === 2) {
      if (form.experienceYears && Number(form.experienceYears) < 0) {
        return "Experience years can't be negative";
      }
    }

    if (step === 3) {
      if (!form.serviceIds.length) {
        return "Please select at least one service";
      }
      if (!form.addressLine1.trim()) {
        return "Address is required";
      }
      if (!form.city.trim()) {
        return "City is required";
      }
      if (!form.pincode.trim()) {
        return "Pincode is required";
      }
      if (!/^\d{6}$/.test(form.pincode.trim())) {
        return "Pincode must be 6 digits";
      }

      const activeSlots = workingSlots.filter((slot) => slot.isAvailable);
      if (!activeSlots.length) {
        return "Select at least one available working day";
      }
    }

    return "";
  };

  const next = () => {
    const e = validateStep();
    if (e) return setErr(e);
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      user?.token;

    if (!user || !token) {
      setErr("Please login first to submit partner request");
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.dob.trim() ||
      !form.city.trim()
    ) {
      setErr("Please fill required fields (Full Name, Phone, Email, DOB, City)");
      setStep(0);
      return;
    }

    if (form.phone.trim().length !== 10) {
      setErr("Enter valid 10-digit phone number");
      setStep(0);
      return;
    }

    if (form.institute === "Other" && !form.customInstitute.trim()) {
      setErr("Please enter your institute name");
      setStep(1);
      return;
    }

    if (!form.serviceIds.length) {
      setErr("Please select at least one service");
      setStep(3);
      return;
    }

    if (!form.addressLine1.trim()) {
      setErr("Please enter address");
      setStep(3);
      return;
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setErr("Please enter valid 6-digit pincode");
      setStep(3);
      return;
    }

    if (!workingSlots.some((slot) => slot.isAvailable)) {
      setErr("Please select at least one available working day");
      setStep(3);
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      const finalInstitute =
        form.institute === "Other"
          ? form.customInstitute.trim()
          : form.institute;

      fd.append("fullName", form.fullName.trim());
      fd.append("phone", form.phone.trim());
      fd.append("gender", form.gender);
      fd.append("email", form.email.trim());
      fd.append("dob", form.dob);
      fd.append("city", form.city.trim());
      fd.append("addressLine1", form.addressLine1.trim());
      fd.append("pincode", form.pincode.trim());

      fd.append("degree", form.degree.trim());
      fd.append("institute", finalInstitute || "");
      fd.append("passingYear", form.passingYear.trim());

      fd.append("experienceYears", form.experienceYears);
      fd.append("currentRole", form.currentRole.trim());
      fd.append("about", form.about.trim());
      fd.append("skills", form.skills.trim());

      fd.append("serviceIds", JSON.stringify(form.serviceIds));
      fd.append("workingSlots", JSON.stringify(workingSlots));

      if (document) fd.append("document", document);

      await submitJoinUsApi(fd);

      navigate("/join-success", {
        state: {
          name: form.fullName,
          roleUpgradeRequested: true,
        },
      });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const previewInstitute =
    form.institute === "Other" ? form.customInstitute : form.institute;

  const availableWorkingDays = workingSlots.filter((slot) => slot.isAvailable);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_24%),linear-gradient(to_bottom_right,#eef2ff,#ffffff,#f5f3ff)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute right-[-80px] top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className={`${cardBase} overflow-hidden`}>
              <div className="relative bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600 px-6 py-8 text-white sm:px-8 sm:py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
                      <Sparkles size={14} />
                      Join our verified partner network
                    </div>

                    <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                      Become a Service Partner
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                      Submit your details as the currently logged-in user. Your
                      profile and partner request can then be processed
                      properly.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
                        <ShieldCheck size={15} />
                        Verified onboarding
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
                        <CheckCircle2 size={15} />
                        Fast review process
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-white/80">
                      <span>Application Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">
                      Step {step + 1} of {steps.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-4 sm:p-6">
                {steps.map((s, idx) => {
                  const Icon = s.icon;
                  const active = idx === step;
                  const done = idx < step;

                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStep(idx)}
                      className={`group rounded-3xl border p-4 text-left transition-all ${
                        active
                          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                            active
                              ? "bg-indigo-600 text-white"
                              : done
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Icon size={20} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-extrabold text-gray-900">
                            {s.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{s.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {(err || msg) && (
              <div
                className={`rounded-3xl border px-5 py-4 text-sm font-semibold ${
                  err
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                {err || msg}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              {step === 0 && (
                <div className={`${cardBase} p-6 sm:p-8`}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <User size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Basic Details
                      </h2>
                      <p className="text-sm text-gray-500">
                        Logged-in user details are auto-filled here.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelBase}>Full Name *</label>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          className={`${inputBase} pl-11`}
                          value={form.fullName}
                          onChange={onChange("fullName")}
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Phone *</label>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          className={`${inputBase} pl-11`}
                          value={form.phone}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              phone: sanitizePhone(e.target.value),
                            }))
                          }
                          placeholder="10-digit mobile number"
                          inputMode="numeric"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Gender *</label>
                      <select
                        className={inputBase}
                        value={form.gender}
                        onChange={onChange("gender")}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelBase}>Email *</label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="email"
                          className={`${inputBase} pl-11`}
                          value={form.email}
                          onChange={onChange("email")}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Date of Birth *</label>
                      <div className="relative">
                        <CalendarDays
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="date"
                          className={`${inputBase} pl-11`}
                          value={form.dob}
                          onChange={onChange("dob")}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>City *</label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          className={`${inputBase} pl-11`}
                          value={form.city}
                          onChange={onChange("city")}
                          placeholder="Enter your city"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className={`${cardBase} p-6 sm:p-8`}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                      <GraduationCap size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Education
                      </h2>
                      <p className="text-sm text-gray-500">
                        Add academic details for verification.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Degree</label>
                      <input
                        className={inputBase}
                        value={form.degree}
                        onChange={onChange("degree")}
                        placeholder="BCA / ITI / Diploma"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Passing Year</label>
                      <input
                        className={inputBase}
                        value={form.passingYear}
                        onChange={onChange("passingYear")}
                        placeholder="2026"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>Institute (Gujarat)</label>
                      <div className="relative">
                        <Building2
                          className="absolute left-4 top-4 text-gray-400"
                          size={18}
                        />
                        <select
                          className={`${inputBase} pl-11`}
                          value={form.institute}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              institute: e.target.value,
                              customInstitute:
                                e.target.value === "Other"
                                  ? p.customInstitute
                                  : "",
                            }))
                          }
                        >
                          <option value="">Select College / University</option>
                          {GUJARAT_COLLEGES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {form.institute === "Other" && (
                      <div className="sm:col-span-2">
                        <label className={labelBase}>
                          Enter Institute Name
                        </label>
                        <input
                          className={inputBase}
                          value={form.customInstitute}
                          onChange={onChange("customInstitute")}
                          placeholder="Type your institute name"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={`${cardBase} p-6 sm:p-8`}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-100 text-pink-700">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Professional
                      </h2>
                      <p className="text-sm text-gray-500">
                        Show your work, skills and experience.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Experience (Years)</label>
                      <input
                        className={inputBase}
                        value={form.experienceYears}
                        onChange={onChange("experienceYears")}
                        placeholder="0 / 1 / 2 ..."
                        inputMode="numeric"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Current Role</label>
                      <div className="relative">
                        <Wrench
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          className={`${inputBase} pl-11`}
                          value={form.currentRole}
                          onChange={onChange("currentRole")}
                          placeholder="Plumber / Electrician / Cleaner"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>About</label>
                      <textarea
                        className={`${inputBase} min-h-[130px]`}
                        rows={5}
                        value={form.about}
                        onChange={onChange("about")}
                        placeholder="Write a short professional summary..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>
                        Skills (comma separated)
                      </label>
                      <input
                        className={inputBase}
                        value={form.skills}
                        onChange={onChange("skills")}
                        placeholder="plumbing, leakage repair, drainage"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>
                        Upload Document (PDF / JPG / PNG)
                      </label>
                      <div className="rounded-[28px] border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                              <FileUp size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900">
                                {document
                                  ? "File selected successfully"
                                  : "Upload ID / Certificate"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {document
                                  ? document.name
                                  : "Supported: PDF, JPG, JPEG, PNG"}
                              </p>
                            </div>
                          </div>

                          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                            Choose File
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                setDocument(e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </div>

                        {document && (
                          <button
                            type="button"
                            onClick={() => setDocument(null)}
                            className="mt-4 text-sm font-bold text-red-600 hover:underline"
                          >
                            Remove file
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={`${cardBase} p-6 sm:p-8`}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <Wrench size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Services & Area
                      </h2>
                      <p className="text-sm text-gray-500">
                        Select services, service area and working availability.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={labelBase}>Select Services *</label>

                      {servicesLoading ? (
                        <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-500">
                          Loading services...
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {services.length === 0 ? (
                            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-500 sm:col-span-2">
                              No services available
                            </div>
                          ) : (
                            services.map((srv) => {
                              const checked = form.serviceIds.includes(srv._id);

                              return (
                                <button
                                  key={srv._id}
                                  type="button"
                                  onClick={() => toggleService(srv._id)}
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    checked
                                      ? "border-indigo-500 bg-indigo-50"
                                      : "border-gray-200 bg-white hover:border-indigo-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-extrabold text-gray-900">
                                        {srv.title}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-500">
                                        {srv.category || "Service"}
                                      </p>
                                    </div>

                                    <div
                                      className={`mt-1 grid h-5 w-5 place-items-center rounded-md border ${
                                        checked
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-gray-300 bg-white"
                                      }`}
                                    >
                                      {checked ? (
                                        <CheckCircle2 size={12} />
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelBase}>Address Line 1 *</label>
                        <input
                          className={inputBase}
                          value={form.addressLine1}
                          onChange={onChange("addressLine1")}
                          placeholder="House no, street, landmark"
                        />
                      </div>

                      <div>
                        <label className={labelBase}>City *</label>
                        <input
                          className={inputBase}
                          value={form.city}
                          onChange={onChange("city")}
                          placeholder="Enter your city"
                        />
                      </div>

                      <div>
                        <label className={labelBase}>Pincode *</label>
                        <input
                          className={inputBase}
                          value={form.pincode}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              pincode: sanitizePincode(e.target.value),
                            }))
                          }
                          placeholder="6-digit pincode"
                          inputMode="numeric"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Working Availability *</label>
                      <div className="space-y-3">
                        {workingSlots.map((slot) => (
                          <div
                            key={slot.day}
                            className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1.3fr_1fr_1fr]"
                          >
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={slot.isAvailable}
                                onChange={(e) =>
                                  updateWorkingSlot(
                                    slot.day,
                                    "isAvailable",
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="font-semibold text-gray-800">
                                {slot.day}
                              </span>
                            </label>

                            <input
                              type="time"
                              className={inputBase}
                              value={slot.startTime}
                              disabled={!slot.isAvailable}
                              onChange={(e) =>
                                updateWorkingSlot(
                                  slot.day,
                                  "startTime",
                                  e.target.value
                                )
                              }
                            />

                            <input
                              type="time"
                              className={inputBase}
                              value={slot.endTime}
                              disabled={!slot.isAvailable}
                              onChange={(e) =>
                                updateWorkingSlot(
                                  slot.day,
                                  "endTime",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
                    step === 0
                      ? "cursor-not-allowed border bg-gray-100 text-gray-400"
                      : "border bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>

                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:opacity-95"
                  >
                    Next Step
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:opacity-95 disabled:opacity-60"
                  >
                    {loading ? "Submitting..." : "Submit Inquiry"}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className={`${cardBase} sticky top-6 p-6`}>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Application Preview
                  </h3>
                  <p className="text-sm text-gray-500">
                    This is what we’ll receive.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.fullName || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {form.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Gender
                    </p>
                    <p className="mt-1 text-sm font-bold capitalize text-gray-900">
                      {form.gender || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-gray-900">
                    {form.email || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    City
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.city || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Address
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.addressLine1 || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Pincode
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.pincode || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Institute
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {previewInstitute || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Current Role
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.currentRole || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Skills
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {form.skills || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Selected Services
                  </p>
                  {selectedServiceNames.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedServiceNames.map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-gray-900">—</p>
                  )}
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Available Working Days
                  </p>
                  {availableWorkingDays.length ? (
                    <div className="mt-2 space-y-1">
                      {availableWorkingDays.map((slot) => (
                        <p
                          key={slot.day}
                          className="text-sm font-bold text-gray-900"
                        >
                          {slot.day}: {slot.startTime} - {slot.endTime}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-gray-900">—</p>
                  )}
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    Document
                  </p>
                  <p className="mt-1 text-sm font-bold text-indigo-900">
                    {document ? "✅ Attached" : "No file selected"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                <p className="text-sm font-black text-indigo-900">Pro Tip</p>
                <p className="mt-1 text-xs leading-6 text-indigo-700">
                  Add real skills, experience, service selection, city and valid
                  document so your partner request can be approved quickly.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="mt-5 w-full rounded-2xl border px-4 py-3 text-sm font-extrabold text-gray-800 transition hover:bg-gray-50"
              >
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}