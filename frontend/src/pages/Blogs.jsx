import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  CalendarDays,
  Clock3,
  Tag,
  ChevronRight,
  Newspaper,
  Sparkles,
} from "lucide-react";

export default function Blogs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const blogs = [
    {
      id: 1,
      title: "How to choose the best plumber for your home",
      date: "2026-02-01",
      readTime: "5 min read",
      category: "Plumbing",
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "A practical guide to selecting a reliable plumber, checking experience, service quality, and avoiding common mistakes.",
    },
    {
      id: 2,
      title: "Top home cleaning tips for a healthier living space",
      date: "2026-01-20",
      readTime: "4 min read",
      category: "Cleaning",
      image:
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "Simple and effective cleaning habits that help keep your home fresh, organized, and hygienic every week.",
    },
    {
      id: 3,
      title: "Electrical safety checklist every family should follow",
      date: "2026-01-10",
      readTime: "6 min read",
      category: "Electrical",
      image:
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "Important safety checks for switches, sockets, wires, appliances, and when it is time to call a professional.",
    },
    {
      id: 4,
      title: "When should you service your AC before summer?",
      date: "2025-12-28",
      readTime: "3 min read",
      category: "Appliance Repair",
      image:
        "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "Learn the best time to schedule AC maintenance and why preventive servicing saves money and improves cooling.",
    },
    {
      id: 5,
      title: "Bathroom deep cleaning: what professionals really do",
      date: "2025-12-14",
      readTime: "5 min read",
      category: "Cleaning",
      image:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "Understand the difference between regular bathroom cleaning and deep cleaning with expert-level results.",
    },
    {
      id: 6,
      title: "How to prepare before a carpenter visits your home",
      date: "2025-12-01",
      readTime: "4 min read",
      category: "Carpentry",
      image:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
      excerpt:
        "A quick checklist to make carpentry work smoother, faster, and more organized for both you and the service partner.",
    },
  ];

  const categories = ["All", ...new Set(blogs.map((b) => b.category))];

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchCategory =
        activeCategory === "All" || blog.category === activeCategory;

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.category.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [blogs, search, activeCategory]);

  const featured = blogs[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* hero */}
      <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200">
                <Newspaper size={16} />
                Tips, guides, and platform updates
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
                Service Finder <span className="text-cyan-300">Blogs</span>
              </h1>
              <p className="mt-4 text-white/75 max-w-2xl leading-7">
                Explore expert tips, booking advice, maintenance guides, and
                useful home service knowledge for customers and partners.
              </p>
            </div>

            <div className="rounded-[28px] bg-white/10 border border-white/15 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blogs, category, tips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-cyan-400 text-slate-900"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center gap-2 text-indigo-600 font-semibold">
          <Sparkles size={18} />
          Featured article
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 rounded-[30px] overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="h-72 lg:h-full">
            <img
              src={featured.image}
              alt={featured.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 font-semibold">
                <Tag size={14} />
                {featured.category}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                {featured.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} />
                {featured.readTime}
              </span>
            </div>

            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {featured.title}
            </h2>
            <p className="mt-4 text-slate-600 leading-7">{featured.excerpt}</p>

            <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 transition">
              Read article
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* blog grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Latest articles
            </h3>
            <p className="text-slate-600 mt-1">
              {filteredBlogs.length} article{filteredBlogs.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-900">No blogs found</p>
            <p className="mt-2 text-slate-600">
              Try another search or select a different category.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm hover:shadow-xl transition"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {blog.category}
                    </span>
                    <span>{blog.date}</span>
                    <span>{blog.readTime}</span>
                  </div>

                  <h4 className="mt-4 text-lg font-extrabold text-slate-900 leading-7">
                    {blog.title}
                  </h4>

                  <p className="mt-3 text-sm text-slate-600 leading-6">
                    {blog.excerpt}
                  </p>

                  <button className="mt-5 inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
                    Read more
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}