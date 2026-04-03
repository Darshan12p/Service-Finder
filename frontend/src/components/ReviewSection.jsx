import React, { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { addOrUpdateReviewApi, getReviewsByServiceApi } from "../services/api";

export default function ReviewSection({ serviceId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!user;

  const load = async () => {
    try {
      const res = await getReviewsByServiceApi(serviceId);
      setReviews(res.data.items || []);
    } catch (e) {
      console.log("reviews load error:", e);
    }
  };

  useEffect(() => {
    if (serviceId) load();
    // eslint-disable-next-line
  }, [serviceId]);

  const submit = async () => {
    setErr("");
    setMsg("");

    if (!isLoggedIn) return setErr("Please login to submit a review.");
    if (!comment.trim() || comment.trim().length < 10) return setErr("Review must be at least 10 characters.");

    try {
      setLoading(true);
      await addOrUpdateReviewApi(serviceId, { rating, comment: comment.trim() });
      setMsg("Review submitted ✅");
      setComment("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="reviews" className="mt-8 rounded-[28px] border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-extrabold text-gray-900">Reviews & Ratings</h3>
      <p className="mt-1 text-sm text-gray-600">Share your experience (min 10 characters).</p>

      {/* Write review */}
      <div className="mt-4 rounded-2xl bg-gray-50 border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-800">Write a review</p>
          <StarRating value={rating} onChange={setRating} size={20} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Write your review..."
          className="mt-3 w-full rounded-2xl border bg-white p-3 outline-none focus:ring"
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">{comment.length}/300</p>
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        {msg && <p className="mt-2 text-sm text-green-600">{msg}</p>}
      </div>

      {/* Show reviews */}
      <div className="mt-5 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">
                    {r?.user?.name || r?.user?.fullName || "Customer"}
                  </p>
                  <p className="text-xs text-gray-500">{r?.user?.email}</p>
                </div>
                <StarRating value={r.rating} readOnly size={18} />
              </div>

              <p className="mt-2 text-sm text-gray-700">{r.comment}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}