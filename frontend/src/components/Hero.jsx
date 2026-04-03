import lovepic from "../assets/main.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Search, Sparkles, ShieldCheck, Clock3 } from "lucide-react";
import { getPublicServicesApi } from "../services/api";

const Hero = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getPublicServicesApi({
          search: q,
          limit: 5,
          page: 1,
        });
        setSuggestions(res.data.items || []);
        setOpen(true);
      } catch (err) {
        console.log("Hero search error", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goSearch = (text) => {
    if (!text.trim()) return;
    navigate(`/services?search=${encodeURIComponent(text)}`);
    setOpen(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-100">
      <div className="absolute top-0 left-0 w-56 h-56 bg-indigo-200/30 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200/30 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12 lg:py-14">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border text-indigo-700 text-xs sm:text-sm font-semibold">
              <Sparkles size={14} />
              Fast • Trusted • Doorstep
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mt-4 text-gray-900">
              Home services made
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                simple & beautiful
              </span>
            </h1>

            <p className="text-gray-600 mt-4 text-sm sm:text-base max-w-xl leading-6">
              Book verified professionals for cleaning, repairs, AC service,
              electrical work, plumbing, beauty care and more — all from one place.
            </p>

            {/* Search */}
            <div
              ref={wrapperRef}
              className="mt-6 flex flex-col sm:flex-row gap-3 relative max-w-xl"
            >
              <div className="flex-1 relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query && setOpen(true)}
                  placeholder="Search cleaning, plumbing, AC repair..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white/90 shadow-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 text-sm"
                />

                {open && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden">
                    {loading ? (
                      <div className="p-4 text-sm text-gray-500">Searching...</div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((s) => (
                        <div
                          key={s._id}
                          onClick={() => goSearch(s.title)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50 transition"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                            {s.imageUrl ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}${s.imageUrl}`}
                                alt={s.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                N/A
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-sm text-gray-900">{s.title}</p>
                            <p className="text-xs text-gray-500">
                              {s.category} • ₹ {s.price}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-gray-500">No results found</div>
                    )}

                    {query && (
                      <button
                        onClick={() => goSearch(query)}
                        className="w-full text-left px-4 py-3 border-t text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        View all results for “{query}”
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => goSearch(query)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg transition"
              >
                Search
              </button>

              <button
                onClick={() => navigate("/categories")}
                className="border border-gray-200 bg-white px-6 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Explore
              </button>
            </div>

            {/* Feature points */}
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border">
                <ShieldCheck size={15} className="text-indigo-600" />
                Verified experts
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border">
                <Clock3 size={15} className="text-indigo-600" />
                Fast booking
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border">
                <Sparkles size={15} className="text-indigo-600" />
                Affordable pricing
              </div>
            </div>

            {/* Stats */}
            <div className="mt-7 grid grid-cols-2 gap-4 max-w-md">
              <div className="p-4 rounded-2xl bg-white/90 border border-white shadow-md">
                <p className="text-2xl font-extrabold text-gray-900">5M+</p>
                <p className="text-gray-600 text-sm mt-1">Happy Customers</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/90 border border-white shadow-md">
                <p className="text-2xl font-extrabold text-gray-900">500+</p>
                <p className="text-gray-600 text-sm mt-1">Services Available</p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center md:justify-end">
            <div className="absolute -inset-3 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 blur-3xl rounded-full" />
            <div className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-3 shadow-xl">
              <img
                src={lovepic}
                alt="home service"
                className="w-full max-w-[420px] lg:max-w-[460px] rounded-[24px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;