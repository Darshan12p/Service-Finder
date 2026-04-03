import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function JoinSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // optional: you can pass state from submit (like name)
  const name = location?.state?.name || "";

  return (
    <div className="min-h-screen bg-white">    

      {/* Center Content */}
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 border border-green-200 grid place-items-center">
            <CheckCircle2 className="text-green-600" size={28} />
          </div>

          <h1 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-900">
            Thank you for applying to Service Finder!
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {name ? (
              <>
                Hi <span className="font-semibold">{name}</span>, we’ll review your
                application and get back to you soon.
              </>
            ) : (
              <>We’ll review your application and get back to you soon.</>
            )}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("/services")}
              className="rounded-full border px-6 py-2.5 text-sm font-extrabold text-indigo-700 hover:bg-indigo-50 transition"
            >
              View Services
            </button>

            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}