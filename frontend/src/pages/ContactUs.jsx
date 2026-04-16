import React, { useState } from "react";
import banner from "../assets/contact-banner.jpg";
import { sendContactMessageApi } from "../services/api";
import { Phone, Mail, MapPin, Send, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
export default function ContactUs() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.mobile.trim()) return "Mobile number is required";
    if (form.mobile.trim().length !== 10) return "Mobile number must be 10 digits";
    if (!form.email.trim()) return "Email is required";
    if (!form.description.trim()) return "Description is required";
    return "";
  };

const onSubmit = async (e) => {
  e.preventDefault();
  setMsg("");
  setErr("");

  const v = validate();
  if (v) {
    setErr(v);

    Swal.fire({
      icon: "warning",
      title: "Validation Error",
      text: v,
      confirmButtonColor: "#4f46e5",
    });
    return;
  }

  try {
    setLoading(true);

    await sendContactMessageApi(form);

    await Swal.fire({
      icon: "success",
      title: "Message Sent Successfully!",
      text: "We will contact you soon.",
      confirmButtonColor: "#4f46e5",
    });

    setMsg("✅ Message sent successfully! We will contact you soon.");
    setForm({
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      description: "",
    });
  } catch (e2) {
    const errorMsg = e2?.response?.data?.message || "Failed to send message";
    setErr(errorMsg);

    Swal.fire({
      icon: "error",
      title: "Failed",
      text: errorMsg,
      confirmButtonColor: "#dc2626",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full bg-gray-50">
      {/* HERO */}
      <section className="relative">
        <div className="h-[320px] sm:h-[360px] w-full overflow-hidden">
          <img src={banner} alt="Contact Us" className="h-full w-full object-cover" />
        </div>

        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white text-sm backdrop-blur">
                Support • 9 AM – 7 PM (Mon–Sat)
              </p>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                Contact Us
              </h1>

              <p className="mt-3 text-white/90 text-base sm:text-lg">
                Tell us your issue or requirement — our team will respond quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Contact Cards */}
            <div className="rounded-[36px] border bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">We’re here to help</h2>
              <p className="mt-2 text-gray-600">
                Reach us anytime. For quick response, fill the form on right.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white grid place-items-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-bold text-gray-900">+91 9638974576</p>
                    <p className="text-xs text-gray-500 mt-1">Fast support & booking help</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white grid place-items-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-bold text-gray-900">darshanbhuva1@gmail.com</p>
                    <p className="text-xs text-gray-500 mt-1">We reply within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white grid place-items-center">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-bold text-gray-900">303 - Kamya Hostel, V.V. Nagar</p>
                    <p className="text-sm text-gray-600">Anand, 388120 • Gujarat</p>
                  </div>
                </div>
              </div>

              {/* highlight strip */}
              <div className="mt-6 rounded-2xl border bg-white p-4">
                <p className="text-sm text-gray-700">
                  ✅ Verified partners • ✅ Secure booking • ✅ Quick service
                </p>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="rounded-[36px] border bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Get in touch</h2>
              <p className="mt-2 text-gray-600">
                Fill this form and we’ll contact you soon.
              </p>

            

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">First Name</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      value={form.firstName}
                      onChange={onChange("firstName")}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      value={form.lastName}
                      onChange={onChange("lastName")}
                    />
                  </div>
                </div>

                {/* Mobile + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Mobile</label>
                    <input
                      type="text"
                      placeholder="10 digit mobile"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      value={form.mobile}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 10) {
                          setForm((p) => ({ ...p, mobile: value }));
                        }
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d*"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      value={form.email}
                      onChange={onChange("email")}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-gray-600">Description</label>
                  <textarea
                    placeholder="Write your issue / requirement..."
                    rows={5}
                    className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    value={form.description}
                    onChange={onChange("description")}
                  />
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3
                             text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500">
                  By submitting, you agree to our support contact policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
