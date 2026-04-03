import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  BadgeCheck,
  Users,
  Sparkles,
  Wrench,
  Clock3,
  Headphones,
  MapPin,
  Star,
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const stats = [
    { label: "Verified Partners", value: "500+" },
    { label: "Happy Customers", value: "10K+" },
    { label: "Cities Covered", value: "25+" },
    { label: "Service Categories", value: "40+" },
  ];

  const features = [
    {
      icon: <BadgeCheck size={22} />,
      title: "Verified Professionals",
      desc: "Every service partner goes through approval and profile verification before joining the platform.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Safe & Transparent Booking",
      desc: "Clear service flow, easy booking process, and better trust with customer-first support.",
    },
    {
      icon: <Clock3 size={22} />,
      title: "On-Time Service",
      desc: "We help customers connect with service partners quickly and reduce delays in home service delivery.",
    },
    {
      icon: <Headphones size={22} />,
      title: "Reliable Support",
      desc: "Our team is available to assist customers and partners for booking, service, and account-related help.",
    },
  ];

  const values = [
    {
      icon: <Sparkles size={20} />,
      title: "Quality",
      desc: "We focus on delivering a professional and trustworthy service experience.",
    },
    {
      icon: <Users size={20} />,
      title: "Customer First",
      desc: "Every design and service decision starts with user convenience and satisfaction.",
    },
    {
      icon: <Wrench size={20} />,
      title: "Practical Solutions",
      desc: "From cleaning to repairs, we make home services simple and accessible.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
          <div className="absolute top-16 right-0 h-80 w-80 rounded-full bg-fuchsia-500 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                <Star size={16} className="text-yellow-300" />
                Trusted doorstep service platform
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
                About <span className="text-cyan-300">Service Finder</span>
              </h1>

              <p className="mt-5 text-white/80 text-base sm:text-lg leading-7 max-w-2xl">
                Service Finder connects customers with trusted and verified
                service partners for home and local services such as cleaning,
                plumbing, electrical work, appliance repair, and more.
              </p>

              <p className="mt-4 text-white/70 leading-7 max-w-2xl">
                Our goal is to make service booking easy, professional, and
                dependable while also creating better work opportunities for
                skilled partners.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                  Fast booking flow
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                  Trusted partners
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                  Better customer support
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-xl"
                >
                  <p className="text-3xl font-extrabold text-cyan-300">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-white/75">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold tracking-wider uppercase text-indigo-600">
            Why choose us
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Built for trust, speed, and convenience
          </h2>
          <p className="mt-4 text-slate-600 leading-7">
            We focus on making service discovery and booking simple for
            customers while helping skilled partners grow with confidence.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* mission / values */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Our mission
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Make home services easier for everyone
            </h2>
            <p className="mt-4 text-slate-600 leading-7">
              We aim to build a modern service platform where customers can
              discover, book, and manage services with confidence, while service
              partners get real opportunities to grow their work and reputation.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-50 border border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-indigo-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Serving local needs</p>
                  <p className="mt-1 text-sm text-slate-600 leading-6">
                    From city-based bookings to local partner support, we are
                    focused on practical services people need every day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 leading-6">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer contact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-[32px] bg-gradient-to-r from-indigo-600 to-cyan-500 p-8 sm:p-10 text-white shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold">
            Let’s build better service experiences
          </h3>
          <p className="mt-3 text-white/85 max-w-2xl leading-7">
            For partnership, support, or business queries, contact our team and
            we’ll help you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              support@servicefinder.com
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              careers@servicefinder.com
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 