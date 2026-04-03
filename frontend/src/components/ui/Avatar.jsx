import React from "react";

const colors = [
  "bg-indigo-500",
  "bg-pink-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-sky-500",
  "bg-violet-500",
];

function getColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name = "", image = "", size = 56 }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bg = getColor(name);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100"
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-white font-bold ${bg}`}
        >
          {initials || "U"}
        </div>
      )}
    </div>
  );
}