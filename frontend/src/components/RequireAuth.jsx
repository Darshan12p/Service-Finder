import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();

  // you store user in localStorage already
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token"); // if you store token (optional)

  // if no user -> redirect to sign page
  if (!user?._id && !token) {
    return <Navigate to="/sign" replace state={{ from: location }} />;
  }

  return children;
}
