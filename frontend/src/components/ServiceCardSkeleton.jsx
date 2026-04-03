import React from "react";

export default function ServiceCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
      
      {/* Image */}
      <div className="h-36 bg-gray-200" />

      {/* Content */}
      <div className="p-3.5">

        {/* category */}
        <div className="h-3 bg-gray-200 rounded w-1/3" />

        {/* title */}
        <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
        <div className="mt-2 h-4 bg-gray-200 rounded w-2/3" />

        {/* chips */}
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>

        {/* price + button */}
        <div className="mt-4 flex items-end justify-between">

          <div>
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="mt-1 h-6 bg-gray-200 rounded w-20" />
          </div>

          <div className="h-9 w-20 bg-gray-200 rounded-xl" />
        </div>

      </div>
    </div>
  );
}