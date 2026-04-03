import { useState } from "react";
import { sendOtpApi, verifyOtpApi } from "../../services/api";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 send, 2 verify
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const normEmail = (v) => String(v || "").trim().toLowerCase();

  const handleSend = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const em = normEmail(email);
    if (!em) return setErr("Enter email");

    try {
      setLoading(true);
      await sendOtpApi(em); // ✅ must call this first
      setMsg("OTP sent to admin email ✅");
      setStep(2);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const em = normEmail(email);
    const code = String(otp || "").trim();
    if (!code) return setErr("Enter OTP");

    try {
      setLoading(true);

      const res = await verifyOtpApi(em, code);
      const { user, token } = res.data;

      if (!token) return setErr("No token received");

      // ✅ allow ONLY admin
      if (user?.role !== "admin") {
        return setErr("You are not admin. Please use website login.");
      }

      // ✅ save admin session only
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify({ ...user, token }));

      window.dispatchEvent(new Event("authChanged"));
      navigate(from, { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">Continue with OTP</p>

        {(err || msg) && (
          <div
            className={`mt-4 rounded-xl p-3 text-sm ${
              err ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {err || msg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSend} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-600">Admin Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border bg-slate-50 px-4 py-3"
                value={email}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">OTP</label>
              <input
                className="mt-1 w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-indigo-200"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="● ● ● ● ● ●"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setErr("");
                setMsg("");
              }}
              className="w-full rounded-xl border py-3 text-sm hover:bg-slate-50"
            >
              Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}