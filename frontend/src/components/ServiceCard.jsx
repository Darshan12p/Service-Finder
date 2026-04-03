import React, { useMemo } from "react";
import { Tag, Star } from "lucide-react";

const clampStyle = (lines) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export default function ServiceCard({ service, onAdd }) {
  const img = useMemo(() => {
    const raw = service?.imageUrl || service?.image || service?.thumbnail || "";
    if (!raw) return "https://via.placeholder.com/800x500?text=Service";
    return raw.startsWith("http") ? raw : `http://localhost:5000${raw}`;
  }, [service]);

  const base = Number(service?.price || service?.startingPrice || 0);

  const hasOffer = service?.offer?.isActive === true;
  const offerType = service?.offer?.discountType;
  const offerValue = Number(service?.offer?.value || 0);

  const discounted = hasOffer
    ? offerType === "fixed"
      ? Math.max(0, base - offerValue)
      : Math.max(0, base - (base * offerValue) / 100)
    : base;

  const title = service?.title || service?.name || "Service";
  const category =
    service?.categoryName || service?.category || service?.serviceCategory || "";

  return (
    <div
      className="group h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm 
                 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative">
        <div className="h-36 w-full overflow-hidden bg-gray-100">
          <img
            src={img}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x500?text=Service";
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Offer badge */}
        {hasOffer && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-green-200 
                         bg-green-50 px-2 py-1 text-[11px] font-extrabold text-green-700 shadow-sm"
            >
              <Tag size={12} />
              {offerType === "fixed" ? `₹${offerValue} OFF` : `${offerValue}% OFF`}
            </span>
          </div>
        )}

        {/* Small rating badge */}
        <div className="absolute left-2.5 bottom-2.5">
          
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Category */}
        <p
          className="text-xs font-medium text-indigo-600"
          style={clampStyle(1)}
          title={category}
        >
          {category || "Home Service"}
        </p>

        {/* Title */}
        <h3
          className="mt-1 text-[15px] font-bold leading-6 text-gray-900 min-h-[3rem]"
          style={clampStyle(2)}
          title={title}
        >
          {title}
        </h3>

        {/* Trust badges */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
            Verified
          </span>
          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 border">
            Quick Booking
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-500">Starting from</p>

            {hasOffer ? (
              <div className="mt-0.5 flex items-end gap-2">
                <p className="text-xs text-gray-400 line-through">₹{base}</p>
                <p className="text-xl font-extrabold text-indigo-600">
                  ₹{Math.round(discounted)}
                </p>
              </div>
            ) : (
              <p className="mt-0.5 text-xl font-extrabold text-indigo-600">₹{base}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAdd?.(service)}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                       transition hover:bg-indigo-700 active:scale-[0.99]
                       cursor-pointer select-none outline-none"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}