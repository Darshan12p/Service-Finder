import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search as SearchIcon, CheckCircle2 } from "lucide-react";
import { getCategoriesApi, getServicesByCategoryApi } from "../services/api";
import PackageModal from "../components/PackageModal";

export default function Search() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [showSug, setShowSug] = useState(false);

  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const inputWrapRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);

      const catsRes = await getCategoriesApi();
      const cats = catsRes?.data?.categories || [];
      const found = cats.find((c) => c._id === id);
      setCategory(found || null);

      const servRes = await getServicesByCategoryApi(id);
      setServices(servRes?.data?.services || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const handler = (e) => {
      if (!inputWrapRef.current) return;
      if (!inputWrapRef.current.contains(e.target)) setShowSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    let result = services;

    const query = q.trim().toLowerCase();

    if (query) {
      result = result.filter((s) =>
        (s.title || "").toLowerCase().includes(query)
      );
    }

    if (filter === "price") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (filter === "popular") {
      result = [...result].sort((a, b) => b.usageCount - a.usageCount);
    }

    // if (filter === "verified") {
    //   result = result.filter((s) => s.isActive);
    // }

    return result;
  }, [q, services, filter]);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return services.slice(0, 5);

    return services
      .filter((s) => (s.title || "").toLowerCase().includes(query))
      .slice(0, 5);
  }, [q, services]);

  const openPackages = (service) => {
    setSelectedService(service);
    setOpen(true);
  };

  const heroTitle = category?.name ? `${category.name} Services` : "Services";

  const heroImage = category?.imageUrl
    ? `${import.meta.env.VITE_API_URL}${category.imageUrl}`
    : "https://images.unsplash.com/photo-1581578731548-c64695cc6952";

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8">
        <div className="relative  rounded-[28px] border bg-black">

          <img
            src={heroImage}
            alt={heroTitle}
            className="h-64 md:h-80 w-full object-cover opacity-70"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/30"/>

          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between">

            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold">
                {heroTitle}
              </h1>
            </div>

            {/* SEARCH BAR */}
            <div className="flex justify-center">
              <div ref={inputWrapRef} className="relative w-full max-w-2xl">

                <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg">

                  <SearchIcon className="text-indigo-600" size={18} />

                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setShowSug(true);
                    }}
                    onFocus={() => setShowSug(true)}
                    placeholder={`Search ${category?.name || "services"}...`}
                    className="w-full outline-none"
                  />

                  {q && (
                    <button
                      onClick={() => setQ("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Suggestions */}
                {showSug && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border z-20">

                    {suggestions.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => {
                          setQ(s.title);
                          setShowSug(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3"
                      >
                        <SearchIcon size={14} className="text-indigo-600"/>
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex gap-6 text-white text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16}/> Verified
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16}/> Quick Booking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER CHIPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-6">
        <div className="flex gap-3 flex-wrap">

          {[
            {id:"all",label:"All"},
            {id:"popular",label:"Popular"},
            {id:"price",label:"Lowest Price"},
            // {id:"verified",label:"Verified"},
          ].map(f=>(
            <button
              key={f.id}
              onClick={()=>setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border
              ${filter===f.id
                ?"bg-indigo-600 text-white border-indigo-600"
                :"bg-white hover:bg-gray-50"}
              `}
            >
              {f.label}
            </button>
          ))}

        </div>
      </section>

      {/* SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {loading ? (
          <div className="bg-white border rounded-2xl p-6">
            Loading services...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6">
            No services found.
          </div>
        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {filtered.map((s) => (

              <div
                key={s._id}
                className="bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
              >

                <div className="h-44 bg-gray-100 overflow-hidden">
                  {s.imageUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${s.imageUrl}`}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid place-items-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">

                  <div className="flex justify-between">

                    <div>
                      <h3 className="font-bold text-lg">{s.title}</h3>
                      <p className="text-sm text-gray-500">
                        {s.category}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Starting</p>
                      <p className="font-bold text-lg">₹{s.price}</p>
                    </div>

                  </div>

                  <div className="mt-4 flex gap-3">

                    <button
                      onClick={() => openPackages(s)}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                    >
                      View Packages
                    </button>

                    <button
                      onClick={() =>
                        navigate("/booking", {
                          state: { serviceId: s._id },
                        })
                      }
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Book
                    </button>

                  </div>

                </div>
              </div>

            ))}
          </div>
        )}
      </section>

      <PackageModal
        open={open}
        setOpen={setOpen}
        selectedService={selectedService}
      />
    </div>
  );
}