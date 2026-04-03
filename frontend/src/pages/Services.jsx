import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPublicServicesApi, getPopularServicesApi } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import PackageModal from "../components/PackageModal";

export default function Services() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type"); // "popular" or null
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination info
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleAdd = (service) => {
    setSelectedService(service);
    setOpen(true);
  };

  const LIMIT = 12;

  const setPageInUrl = (p) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(p));
    navigate(`/services?${sp.toString()}`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        let res;

        if (type === "popular") {
          res = await getPopularServicesApi({ limit: 200 });
        } else {
          res = await getPublicServicesApi({ page, limit: LIMIT });
        }

        // ✅ items list
        const list =
          res?.data?.items ||
          res?.data?.services ||
          res?.items ||
          res?.services ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) ||
          [];

        setServices(list);

        const tp =
          res?.data?.totalPages ||
          res?.data?.pagination?.totalPages ||
          res?.totalPages ||
          1;

        setTotalPages(Number(tp) || 1);

        setHasMore(type === "popular" ? false : list.length === LIMIT);
      } catch (e) {
        console.log("SERVICES PAGE ERROR:", e);
        setServices([]);
        setTotalPages(1);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type, page]); // reload when page changes

  const canPrev = type !== "popular" && page > 1;
  const canNext =
    type !== "popular" &&
    (page < totalPages || (totalPages === 1 && hasMore));

  const pagesToShow = useMemo(() => {
    if (type === "popular") return [];
    const tp = totalPages || 1;

    if (!tp || tp === 1) return [];

    // show: [page-1, page, page+1] inside bounds
    const arr = [];
    for (let p = Math.max(1, page - 1); p <= Math.min(tp, page + 1); p++) arr.push(p);
    return arr;
  }, [type, totalPages, page]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            {type === "popular" ? "Popular Services" : "All Services"}
          </h1>
          {!type && (
            <p className="text-sm text-gray-500 mt-1">
              Page <span className="font-semibold">{page}</span>
              {totalPages > 1 ? (
                <>
                  {" "}of <span className="font-semibold">{totalPages}</span>
                </>
              ) : null}
            </p>
          )}
        </div>

        {/* Pagination Controls Top */}
        {!type && (
          <div className="flex items-center gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setPageInUrl(page - 1)}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              ← Prev
            </button>

            {pagesToShow.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {pagesToShow.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPageInUrl(p)}
                    className={`h-9 w-9 rounded-xl border text-sm font-semibold ${
                      p === page ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <button
              disabled={!canNext}
              onClick={() => setPageInUrl(page + 1)}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-600">Loading...</p>
      ) : services.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-4 text-gray-600 shadow-sm">
          {type === "popular" ? "No popular services found." : "No services found."}
        </div>
      ) : ( 
        <>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} onAdd={handleAdd} />
            ))}
          </div>

          {/* Pagination Controls Bottom */}
          {!type && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                disabled={!canPrev}
                onClick={() => setPageInUrl(page - 1)}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                ← Prev
              </button>

              <span className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span>
                {totalPages > 1 ? (
                  <>
                    {" "}of <span className="font-semibold">{totalPages}</span>
                  </>
                ) : null}
              </span>

              <button
                disabled={!canNext}
                onClick={() => setPageInUrl(page + 1)}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <PackageModal
        open={open}
        setOpen={setOpen}
        selectedService={selectedService}
      />
    </div>
  );
}