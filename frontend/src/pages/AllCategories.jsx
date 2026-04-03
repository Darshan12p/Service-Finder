import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoriesApi } from "../services/api";

export default function AllCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getCategoriesApi();
        setCategories(res?.data?.categories || []);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenCategory = (categoryId) => {
    // ✅ redirect to search page with category id
    navigate(`/search/${categoryId}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            All Categories
          </h1>
          <p className="text-gray-600 mt-1">
            Choose a category to explore services
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-indigo-600 font-semibold hover:underline"
        >
          ← Back
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleOpenCategory(category._id)} // ✅ FIX
              className="text-left group border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 grid place-items-center overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${category.imageUrl}`}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl">{category.icon || "🧰"}</div>
                )}
              </div>

              <p className="mt-3 font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                {category.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tap to explore</p>
            </button>
          ))}

          {categories.length === 0 && (
            <div className="text-gray-500">No categories available.</div>
          )}
        </div>
      )}
    </section>
  );
}
