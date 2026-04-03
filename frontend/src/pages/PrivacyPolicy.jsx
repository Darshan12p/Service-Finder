import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  FileText,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Database size={20} />,
      title: "1. Information we collect",
      points: [
        "Basic user details such as name, phone number, and email address.",
        "Address and booking details required to provide home services.",
        "Profile and application information submitted by service partners.",
        "Technical or usage-related information to improve product performance.",
      ],
    },
    {
      icon: <UserCheck size={20} />,
      title: "2. How we use your information",
      points: [
        "To create and manage service bookings.",
        "To contact users regarding confirmations, updates, and support.",
        "To improve service quality, platform operations, and user experience.",
        "To help verify partners and maintain trust and safety standards.",
      ],
    },
    {
      icon: <Lock size={20} />,
      title: "3. Data protection and security",
      points: [
        "We only keep information that is necessary for platform operations.",
        "We use reasonable security practices to protect account and booking data.",
        "Access to sensitive information is limited to authorized processes and roles.",
      ],
    },
    {
      icon: <FileText size={20} />,
      title: "4. Sharing of information",
      points: [
        "We do not sell personal information.",
        "Relevant booking details may be shared with assigned service partners to complete the requested service.",
        "Information may be shared when required for legal, compliance, or platform safety reasons.",
      ],
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "5. User rights and updates",
      points: [
        "Users may contact us to update or correct account information.",
        "Policy content may be updated when platform features or legal requirements change.",
        "Continued use of the platform indicates acceptance of the latest policy version.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* hero */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-400/15 px-4 py-2 text-sm font-medium text-indigo-200">
              <ShieldCheck size={16} />
              Privacy & data protection
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
              Privacy Policy
            </h1>

            <p className="mt-4 text-white/75 leading-7 text-base sm:text-lg">
              This page explains how Service Finder collects, uses, protects,
              and manages user information across bookings, accounts, and
              platform interactions.
            </p>
          </div>
        </div>
      </section>

      {/* content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
          {/* left summary */}
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900">
                Your privacy matters
              </h2>
              <p className="mt-3 text-slate-600 leading-7">
                We are committed to handling customer and partner information
                responsibly and transparently while supporting secure and smooth
                service delivery.
              </p>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-indigo-600 to-cyan-500 p-6 text-white shadow-xl">
              <h3 className="text-lg font-extrabold">Quick highlights</h3>
              <div className="mt-4 space-y-3">
                {[
                  "We collect only needed information",
                  "We do not sell personal data",
                  "Booking details are used to provide service",
                  "Users can contact us for privacy support",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span className="text-sm text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Mail className="text-indigo-600 mt-1" size={20} />
                <div>
                  <p className="font-bold text-slate-900">Need help?</p>
                  <p className="mt-1 text-sm text-slate-600 leading-6">
                    For any privacy or account-related question, contact:
                  </p>
                  <p className="mt-3 inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                    support@servicefinder.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* sections */}
          <div className="space-y-5">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {section.title}
                    </h3>

                    <div className="mt-4 space-y-3">
                      {section.points.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                          <p className="text-slate-600 leading-7">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm text-slate-600 leading-7">
                This privacy policy is a general platform policy UI for your
                project. If your application is going live, you should replace
                this with your final legal policy content.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}