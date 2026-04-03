import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MapPin,
  Briefcase,
  Clock3,
  Users,
  Sparkles,
  BadgeCheck,
  Send,
} from "lucide-react";

export default function Careers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const roles = [
    {
      id: 1,
      title: "Customer Support Executive",
      type: "Full-time",
      location: "Ahmedabad",
      experience: "0-2 Years",
      department: "Support",
      description:
        "Help customers with bookings, service concerns, and issue resolution through a friendly support experience.",
    },
    {
      id: 2,
      title: "Frontend Developer (React)",
      type: "Internship",
      location: "Remote",
      experience: "Fresher",
      department: "Engineering",
      description:
        "Build modern user interfaces, improve UX, and work on customer-facing product pages using React and Tailwind CSS.",
    },
    {
      id: 3,
      title: "Operations Coordinator",
      type: "Full-time",
      location: "Ahmedabad",
      experience: "1-3 Years",
      department: "Operations",
      description:
        "Coordinate daily service operations, booking flow, and partner activity to improve overall execution quality.",
    },
    {
      id: 4,
      title: "Backend Developer (Node.js)",
      type: "Full-time",
      location: "Remote",
      experience: "1-3 Years",
      department: "Engineering",
      description:
        "Develop APIs, booking logic, authentication, and admin workflows with scalable backend structure.",
    },
    {
      id: 5,
      title: "Digital Marketing Intern",
      type: "Internship",
      location: "Ahmedabad",
      experience: "Fresher",
      department: "Marketing",
      description:
        "Support social media campaigns, content planning, and user growth initiatives across digital platforms.",
    },
  ];

  const benefits = [
    "Work on real product features",
    "Friendly and collaborative team",
    "Growth-focused environment",
    "Flexible and modern workflow",
  ];

  const types = ["All", ...new Set(roles.map((r) => r.type))];

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchType = typeFilter === "All" || role.type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        role.title.toLowerCase().includes(q) ||
        role.location.toLowerCase().includes(q) ||
        role.department.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q);

      return matchType && matchSearch;
    });
  }, [roles, search, typeFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-indigo-500 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-200">
                <Sparkles size={16} />
                Build your future with us
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
                Join the <span className="text-emerald-300">Service Finder</span> team
              </h1>

              <p className="mt-4 text-white/75 max-w-2xl leading-7">
                We are building a better service experience for customers and
                partners. Join our growing team and work on meaningful product,
                support, and operations challenges.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-3">
                {benefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <BadgeCheck size={18} className="text-emerald-300" />
                    <span className="text-sm text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roles, department, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {types.map((item) => {
                  const active = typeFilter === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setTypeFilter(item)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-emerald-400 text-slate-900"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-white/10 px-4 py-4 text-sm text-white/80">
                Current openings:{" "}
                <span className="font-bold text-white">{filteredRoles.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* openings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Open positions
            </h2>
            <p className="text-slate-600 mt-1">
              Explore opportunities and apply to join our team.
            </p>
          </div>
        </div>

        {filteredRoles.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-900">No job found</p>
            <p className="mt-2 text-slate-600">
              Try another keyword or job type filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold">
                        {role.department}
                      </span>
                      <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                        {role.type}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {role.title}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <MapPin size={16} />
                        {role.location}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Briefcase size={16} />
                        {role.experience}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Clock3 size={16} />
                        Immediate / Open
                      </div>
                    </div>

                    <p className="mt-4 text-slate-600 leading-7">
                      {role.description}
                    </p>
                  </div>

                  <div className="lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
                    <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 transition">
                      <Send size={16} />
                      Apply Now
                    </button>
                    <button className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-[30px] bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-white shadow-xl">
          <h3 className="text-2xl font-extrabold">Didn’t find a matching role?</h3>
          <p className="mt-3 text-white/85 max-w-2xl leading-7">
            You can still send your resume and portfolio to our team for future
            opportunities.
          </p>
          <div className="mt-5 inline-flex rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">
            careers@servicefinder.com
          </div>
        </div>
      </section>
    </div>
  );
}