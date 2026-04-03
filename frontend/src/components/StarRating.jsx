// src/components/StarRating.jsx
import React, { useMemo, useState } from "react";

export default function StarRating({
  value = 0,
  onChange = () => {},
  max = 5,
  size = 34,
  readOnly = false,
  className = "",
}) {
  const [hover, setHover] = useState(null);

  const displayValue = hover ?? value;

  const stars = useMemo(() => {
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [max]);

  const handleSelect = (v) => {
    if (readOnly) return;
    onChange(v);
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(max, Number(value || 0) + 1));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, Number(value || 0) - 1));
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // keep current
    }
  };

  return (
    <div
      className={[
        "inline-flex items-center gap-1 select-none",
        readOnly ? "cursor-default" : "cursor-pointer",
        className,
      ].join(" ")}
      role="radiogroup"
      aria-label="Star rating"
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {stars.map((star) => {
        const active = star <= displayValue;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={Number(value) === star}
            aria-label={`${star} star`}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(star)}
            onClick={() => handleSelect(star)}
            className={[
              "p-0.5 rounded-md transition-transform",
              !readOnly && "hover:scale-110 active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-indigo-100",
            ].join(" ")}
            style={{ lineHeight: 0 }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className="transition"
            >
              <path
                d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={active ? "#f59e0b" : "#e5e7eb"} // gold / gray
                stroke={active ? "#d97706" : "#94a3b8"} // darker border
                strokeWidth="1"
              />
            </svg>
          </button>
        );
      })}

      {/* number text (optional small) */}
      <span className="ml-2 text-sm font-extrabold text-slate-800">
        {Number(displayValue || 0)}/{max}
      </span>
    </div>
  );
}