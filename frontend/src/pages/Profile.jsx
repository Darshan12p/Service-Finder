import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfileApi, updateMyProfileApi } from "../services/api";
import {
  ArrowLeft,
  User2,
  Mail,
  Phone,
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  Save,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();

  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = localUser?._id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fullName = useMemo(() => {
    return profile?.name || profile?.fullName || form.name || "User";
  }, [profile, form.name]);

  const initials = useMemo(() => {
    const source = fullName || profile?.email || "U";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [fullName, profile?.email]);

  const joinedText = useMemo(() => {
    const raw = profile?.createdAt || profile?.updatedAt;
    if (!raw) return "Recently joined";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "Recently joined";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [profile?.createdAt, profile?.updatedAt]);

  useEffect(() => {
    if (!userId) {
      navigate("/sign");
      return;
    }

    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await getMyProfileApi(userId);
        const u = res?.data?.user;

        if (!mounted) return;

        if (!u) {
          setProfile(null);
          setError("Profile not found");
          return;
        }

        setProfile(u);
        setForm({
          name: u?.name || u?.fullName || "",
          phone: u?.phone || "",
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate, userId]);

  const onChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const validate = () => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName) {
      return "Full name is required";
    }

    if (trimmedName.length < 2) {
      return "Full name must be at least 2 characters";
    }

    if (trimmedPhone) {
      const phoneDigits = trimmedPhone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return "Please enter a valid phone number";
      }
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };

      const res = await updateMyProfileApi(userId, payload);
      const updatedUser = res?.data?.user;

      if (!updatedUser) {
        throw new Error("Updated profile data not received");
      }

      setProfile(updatedUser);
      setForm({
        name: updatedUser?.name || updatedUser?.fullName || "",
        phone: updatedUser?.phone || "",
      });
      setSuccess("Profile updated successfully");

      // keep token / other existing local fields safe
      const existingLocalUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null") || {};
        } catch {
          return {};
        }
      })();

      const mergedUser = {
        ...existingLocalUser,
        ...updatedUser,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));
      window.dispatchEvent(new Event("authChanged"));
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: profile?.name || profile?.fullName || "",
      phone: profile?.phone || "",
    });
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="h-7 w-44 animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-3 h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
            </div>

            <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="border-r border-slate-200 bg-slate-50 p-6">
                <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mx-auto mt-4 h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
                <div className="mx-auto mt-2 h-4 w-52 animate-pulse rounded-lg bg-slate-100" />
              </div>

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 h-12 w-40 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">
            Profile not found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            We could not load your profile details right now.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profileName = profile?.name || profile?.fullName || "User";
  const profileEmail = profile?.email || "No email";
  const profilePhone = profile?.phone || "Not added";
  const profileRole = profile?.role || "customer";
  const verified = !!profile?.isVerified;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* top nav */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your personal details and account information
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Back Home
          </button>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* left panel */}
            <aside className="border-b border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-6 text-white lg:border-b-0 lg:border-r">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white/10 text-2xl font-black text-white ring-4 ring-white/10">
                    {initials || "U"}
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight">
                    {profileName}
                  </h2>
                  <p className="mt-1 break-all text-sm text-slate-300">
                    {profileEmail}
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                      <Briefcase size={13} />
                      {profileRole}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
                        verified
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300"
                      }`}
                    >
                      {verified ? <ShieldCheck size={13} /> : <AlertCircle size={13} />}
                      {verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Mail size={16} className="text-slate-300" />
                    <span className="truncate">{profileEmail}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Phone size={16} className="text-slate-300" />
                    <span>{profilePhone}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CalendarDays size={16} className="text-slate-300" />
                    <span>Member since {joinedText}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-900 transition hover:bg-slate-100"
                >
                  <Receipt size={18} />
                  View My Bookings
                </button>
              </div>
            </aside>

            {/* right panel */}
            <section className="p-5 sm:p-6 lg:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  <BadgeCheck size={14} />
                  Account settings
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                  Personal information
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your details updated for better booking and communication.
                </p>
              </div>

              {error ? (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {success ? (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Full Name
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
                    <User2 size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
                    <Phone size={18} className="text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={profileEmail}
                      disabled
                      className="w-full cursor-not-allowed border-0 bg-transparent text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Account Role
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Briefcase size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={profileRole}
                      disabled
                      className="w-full cursor-not-allowed border-0 bg-transparent capitalize text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Verification
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={verified ? "Verified" : "Not Verified"}
                      disabled
                      className="w-full cursor-not-allowed border-0 bg-transparent text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 px-6 py-3.5 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>

                <button
                  onClick={() => navigate("/my-bookings")}
                  className="rounded-2xl border border-slate-200 px-6 py-3.5 font-black text-slate-700 transition hover:bg-slate-50"
                >
                  My Bookings
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}