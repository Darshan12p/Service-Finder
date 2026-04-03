import { useState } from "react";
import { sendOtpApi, verifyOtpApi } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sign() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = send otp, 2 = verify otp
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const navigate = useNavigate();

  // ✅ SEND OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Please enter your name");

    const emailTrim = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) return setError("Enter a valid email");

    try {
      setLoading(true);
      await sendOtpApi(emailTrim);
      setSuccess("OTP sent to your email");
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpTrim = otp.trim();
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    const cityTrim = city.trim();

    if (!otpTrim) return setError("Enter OTP");

    try {
      setLoading(true);

      const res = await verifyOtpApi(emailTrim, otpTrim, {
        name: name.trim(),
        phone: phoneTrim,
        city: cityTrim,
      });

      const { user, token } = res.data;

      if (!token) {
        setError("Login failed: no token received");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      localStorage.setItem("token", token);

      const finalUser = {
        ...user,
        name: user?.profile?.name || user?.name || name.trim(),
        email: user?.email || emailTrim,
        role: user?.role || "customer",
        profile: {
          ...(user?.profile || {}),
          name: user?.profile?.name || name.trim(),
          phone: user?.profile?.phone || phoneTrim,
          city: user?.profile?.city || cityTrim,
        },
      };

      localStorage.setItem("user", JSON.stringify(finalUser));
      localStorage.setItem("role", finalUser.role);

      window.dispatchEvent(new Event("authChanged"));

      setSuccess("Login successful");
      navigate(from);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* LEFT INFO PANEL */}
        <div className="hidden md:flex flex-col justify-center p-10 text-black">
          <h2 className="text-3xl font-extrabold leading-tight">
            Welcome to <br /> Service Finder
          </h2>
          <p className="mt-4">
            Book trusted professionals for home services — fast, safe &
            reliable.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>✔ Verified service partners</li>
            <li>✔ Secure OTP login</li>
            <li>✔ No password needed</li>
          </ul>
        </div>

        {/* RIGHT FORM */}
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-extrabold text-gray-900">
            {step === 1 ? "Sign In" : "Verify OTP"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1
              ? "Continue with email OTP"
              : "Enter the OTP sent to your email"}
          </p>

          {(error || success) && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
            >
              {error || success}
            </div>
          )}

          {step === 1 ? (
            <form
              className="mt-6 space-y-5"
              onSubmit={handleSendOtp}
              autoComplete="on"
            >
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  className="w-full mt-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">City</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  autoComplete="address-level2"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form
              className="mt-6 space-y-5"
              onSubmit={handleVerifyOtp}
              autoComplete="on"
            >
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 bg-gray-50"
                  value={name}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  className="w-full mt-1 border rounded-xl px-4 py-3 bg-gray-50"
                  value={email}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 bg-gray-50"
                  value={phone}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">City</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 bg-gray-50"
                  value={city}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">OTP</label>
                <input
                  className="w-full mt-1 border rounded-xl px-4 py-3 tracking-widest text-center text-lg focus:ring-2 focus:ring-indigo-300"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="● ● ● ● ● ●"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                className="w-full border py-3 rounded-xl hover:bg-gray-50 text-sm"
              >
                Change Details
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
