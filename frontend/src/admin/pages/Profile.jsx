import React, { useEffect, useRef, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Pencil,
  Shield,
  Camera,
  User,
  X,
  Save,
  BadgeCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  getAdminProfileApi,
  updateAdminProfileApi,
} from "../../services/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 sm:text-base">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, maxWidth = "max-w-xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full rounded-3xl border border-slate-200 bg-white shadow-2xl",
          maxWidth
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    _id: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    role: "admin",
    isActive: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [imgError, setImgError] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
  });

  const syncAdminLocalStorage = (data) => {
    try {
      const oldAdmin = JSON.parse(localStorage.getItem("admin") || "null");
      if (!oldAdmin) return;

      localStorage.setItem(
        "admin",
        JSON.stringify({
          ...oldAdmin,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          profile: {
            ...(oldAdmin.profile || {}),
            name: data.name,
            phone: data.phone,
            city: data.location,
            image: data.avatar,
          },
        })
      );
    } catch (error) {
      console.error("localStorage sync error:", error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getAdminProfileApi();
      const admin = res?.data?.admin || {};

      const data = {
        _id: admin._id || "",
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        location: admin.location || "",
        avatar: admin.avatar || "",
        role: admin.role || "admin",
        isActive: admin.isActive ?? true,
      };

      setProfile(data);
      setForm({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        avatar: data.avatar,
      });

      syncAdminLocalStorage(data);
    } catch (error) {
      console.error("loadProfile error:", error);
      Swal.fire("Error", "Failed to load admin profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() || "";
      setPreviewAvatar(base64);
      setForm((prev) => ({ ...prev, avatar: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) {
        Swal.fire("Validation", "Name is required", "warning");
        return;
      }

      setSaving(true);

      const payload = {
        name: form.name,
        phone: form.phone,
        location: form.location,
        avatar: form.avatar,
      };

      const res = await updateAdminProfileApi(payload);
      const admin = res?.data?.admin || {};

      const updated = {
        _id: admin._id || profile._id,
        name: admin.name || form.name,
        email: admin.email || profile.email,
        phone: admin.phone || form.phone,
        location: admin.location || form.location,
        avatar: admin.avatar || form.avatar,
        role: admin.role || profile.role,
        isActive: admin.isActive ?? profile.isActive,
      };

      setProfile(updated);
      setForm({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        location: updated.location,
        avatar: updated.avatar,
      });
      setPreviewAvatar("");
      setEditOpen(false);

      syncAdminLocalStorage(updated);

      Swal.fire("Success", "Profile updated successfully", "success");
    } catch (error) {
      console.error("handleSave error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile.name || "Admin";
  const displayRole =
    profile.role?.charAt(0)?.toUpperCase() + profile.role?.slice(1) || "Admin";

  const avatarUrl = previewAvatar
    ? previewAvatar
    : profile.avatar && !imgError
      ? profile.avatar.startsWith("http") ||
        profile.avatar.startsWith("data:image")
        ? profile.avatar
        : `http://localhost:5000${profile.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=4f46e5&color=ffffff&size=256`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Admin Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Manage your account information
          </p>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <div className="relative h-40 bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 sm:h-52">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <div className="relative -mt-14 sm:-mt-16">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
                  <div className="relative w-fit">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-32 sm:w-32">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
                    >
                      <Camera size={16} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="pb-1">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {displayName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 sm:text-base">
                      {displayRole}
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {profile.isActive ? "Active Account" : "Inactive Account"}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 sm:w-auto"
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-md">
                <p className="text-sm text-slate-500">Role</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {displayRole}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-md">
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {profile.location || "Not added"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-md">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-2 text-xl font-bold text-emerald-600">
                  {profile.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <BadgeCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Contact Information
                    </h3>
                    <p className="text-sm text-slate-500">
                      Admin account details
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoCard
                    icon={<Phone size={18} />}
                    label="Phone"
                    value={profile.phone || "Not added"}
                  />
                  <InfoCard
                    icon={<Mail size={18} />}
                    label="Email"
                    value={profile.email || "Not added"}
                  />
                  <InfoCard
                    icon={<MapPin size={18} />}
                    label="Location"
                    value={profile.location || "Not added"}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Security
                    </h3>
                    <p className="text-sm text-slate-500">
                      Account protection info
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoCard
                    icon={<User size={18} />}
                    label="Account Type"
                    value="Admin"
                  />

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-700">
                      Your account is active and protected
                    </p>
                    <p className="mt-1 text-xs text-emerald-600">
                      Profile changes are saved in database and synced to local
                      storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal open={editOpen} title="Edit Profile" onClose={() => setEditOpen(false)}>
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 shadow">
                <img
                  src={avatarUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={openFilePicker}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Upload Avatar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Enter phone"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <input
                  type="text"
                  value={displayRole}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Enter location"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}