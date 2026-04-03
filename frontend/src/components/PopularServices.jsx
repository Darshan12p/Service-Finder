import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight } from "lucide-react";
import { getPopularServicesApi } from "../services/api";
import ServiceCard from "./ServiceCard";
import ServiceCardSkeleton from "./ServiceCardSkeleton";
import PackageModal from "./PackageModal";

export default function PopularServices() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleAdd = (service) => {
    setSelectedService(service);
    setOpen(true);
  };

  useEffect(() => {
    const loadPopular = async () => {
      try {
        setLoading(true);
        const res = await getPopularServicesApi({ limit: 50 });

        const list =
          res?.data?.items ||
          res?.data?.services ||
          res?.items ||
          res?.services ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) ||
          [];

        setServices(list.slice(0, 4));
      } catch (e) {
        console.log(e);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadPopular();
  }, []);

  return (
    <section className="w-full py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 sm:p-6 shadow-sm">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border shadow-sm text-orange-600 text-xs font-semibold">
                <Flame size={14} />
                Trending
              </div>

              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
                Popular Services
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Most booked services with trusted professionals.
              </p>
            </div>

            <button
              onClick={() => navigate("/services?type=popular")}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 border shadow-sm hover:bg-indigo-50"
            >
              See more <ArrowRight size={14} />
            </button>

          </div>

          {/* Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4 items-stretch">
            {loading ? (
              <>
                <ServiceCardSkeleton />
                <ServiceCardSkeleton />
                <ServiceCardSkeleton />
                <ServiceCardSkeleton />
              </>
            ) : services.length === 0 ? (
              <div className="md:col-span-4 rounded-xl bg-white p-5 text-gray-600 border">
                No popular services found.
              </div>
            ) : (
              services.map((s) => (
                <ServiceCard key={s._id} service={s} onAdd={handleAdd} />
              ))
            )}
          </div>

        </div>

        <PackageModal
          open={open}
          setOpen={setOpen}
          selectedService={selectedService}
          redirectToBooking={true}
        />
      </div>
    </section>
  );
}