import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategoriesApi } from "../services/api";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi();
      setCategories(res.data.categories || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Explore Categories
          </h2>
          <p className="text-gray-600 mt-2">
            Find the perfect service in just a few clicks.
          </p>
        </div>

        <button
          onClick={() => navigate("/categories")}
          className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition"
        >
          View all <ArrowRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.slice(0, 6).map((category) => (
            <button
              key={category._id}
              onClick={() => navigate(`/search/${category._id}`)}
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-0 group-hover:opacity-100 transition" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 grid place-items-center overflow-hidden shadow-sm">
                  {category.imageUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${category.imageUrl}`}
                      alt={category.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="text-2xl">{category.icon}</div>
                  )}
                </div>

                <p className="mt-4 font-bold text-gray-900 group-hover:text-indigo-700 transition">
                  {category.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tap to explore</p>
              </div>
            </button>
          ))}

          {categories.length === 0 && (
            <div className="text-gray-500">No categories available.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default Categories;