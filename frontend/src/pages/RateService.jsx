// src/pages/RateService.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addOrUpdateReviewApi, getBookingForRatingApi } from "../services/api";
import StarRating from "../components/StarRating";
import Swal from "sweetalert2";
import Avatar from "../components/ui/Avatar";

export default function RateService() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [service, setService] = useState(null);
  const [partner, setPartner] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [canReview, setCanReview] = useState(false);

  // ---------- Load booking/service/partner ----------
  useEffect(() => {
    const load = async () => {
      try {
        setErr("");
        setMsg("");
        setLoading(true);

        const token =
          localStorage.getItem("userToken") ||
          localStorage.getItem("token") ||
          JSON.parse(localStorage.getItem("user") || "null")?.token;

        if (!token) {
          setErr("Please login again. Token not found.");
          setLoading(false);
          return;
        }

        const res = await getBookingForRatingApi(bookingId);

        const b = res?.data?.booking || null;
        const existing = res?.data?.existingReview || null;
        const allowed = !!res?.data?.canReview;

        setBooking(b);
        setService(b?.serviceId || null);
        setPartner(b?.assignedPartnerId || null);
        setCanReview(allowed);

        if (existing?.rating) setRating(Number(existing.rating));
        if (existing?.comment) setComment(String(existing.comment));
      } catch (e) {
        setErr(
          e?.response?.data?.message || "Failed to load booking for rating.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  // ---------- Image URL ----------
  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const imageSrc = useMemo(() => {
    const raw = service?.imageUrl || service?.image || "";
    if (!raw) return "";
    return raw.startsWith("http") ? raw : `${apiBase}${raw}`;
  }, [service, apiBase]);

  const partnerImageSrc = useMemo(() => {
    const raw = partner?.profile?.image || partner?.image || "";
    if (!raw) return "";
    return raw.startsWith("http") ? raw : `${apiBase}${raw}`;
  }, [partner, apiBase]);

  // ---------- UX helpers ----------
  const charCount = comment.length;
  const minChars = 10;
  const maxChars = 1000;

  const commentTrimmed = comment.trim();
  const commentOk =
    commentTrimmed.length >= minChars && commentTrimmed.length <= maxChars;

  const ratingLabel = useMemo(() => {
    const r = Number(rating || 0);
    if (r >= 5) return "Excellent ⭐";
    if (r >= 4) return "Great 👍";
    if (r >= 3) return "Good 🙂";
    if (r >= 2) return "Okay 😐";
    return "Poor 😞";
  }, [rating]);

  const canSubmit =
    !!booking?._id &&
    !!partner?._id &&
    booking?.bookingStatus === "Completed" &&
    Number(rating) >= 1 &&
    commentOk &&
    !saving &&
    canReview;

  // ---------- Submit ----------
  const submit = async () => {
    setErr("");
    setMsg("");

    if (!booking?._id) return setErr("Booking not found.");
    if (!partner?._id) return setErr("Assigned partner not found.");

    if (booking?.bookingStatus !== "Completed") {
      return setErr("You can review only after the booking is completed.");
    }

    if (!commentTrimmed || commentTrimmed.length < minChars) {
      return setErr(`Review must be at least ${minChars} characters.`);
    }

    try {
      setSaving(true);

      await addOrUpdateReviewApi(booking._id, {
        rating: Number(rating),
        comment: commentTrimmed,
      });

      setMsg("Thanks! Your review is submitted ✅");

      await Swal.fire({
        icon: "success",
        title: "Review Submitted!",
        text: "Your review for the assigned partner has been submitted successfully.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
      });

      navigate("/my-bookings");
    } catch (e) {
      setErr(e?.response?.data?.message || "Submit failed.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI states ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-[28px] border bg-white p-6 shadow-sm">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-100" />
            <div className="mt-6 h-28 w-full animate-pulse rounded-3xl bg-slate-100" />
            <div className="mt-6 h-10 w-56 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-28 w-full animate-pulse rounded-3xl bg-slate-100" />
            <div className="mt-4 h-10 w-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-gradient-to-br">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-2 py-5 text-white">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold backdrop-blur"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {err && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-extrabold">Something went wrong</div>
            <div className="mt-1">{err}</div>
          </div>
        )}

        {msg && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="font-extrabold">Success</div>
            <div className="mt-1">{msg}</div>
          </div>
        )}

        {!canReview && booking?.bookingStatus !== "Completed" && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <div className="font-extrabold">Review not available yet</div>
            <div className="mt-1">
              You can rate this booking only after the partner completes the
              service.
            </div>
          </div>
        )}

        <div className="rounded-[28px] border bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="relative h-36 w-full overflow-hidden rounded-3xl border bg-slate-100 sm:h-28 sm:w-40">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={service?.title || "Service"}
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <Avatar
                  name={selected?.fullName || "User"}
                  image={selected?.profileImage || ""}
                  size={64}
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-slate-900">
                    {service?.title || booking?.serviceTitle || "Service"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share your experience with the assigned partner.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">
                    Service rating
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {Number(service?.avgRating || 0).toFixed(1)}{" "}
                    <span className="text-xs font-semibold text-slate-500">
                      ({service?.ratingCount || 0})
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  {ratingLabel}
                </span>
                <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  Your rating: {Number(rating).toFixed(0)}/5
                </span>
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-bold",
                    commentOk
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  Review: {Math.min(charCount, maxChars)}/{maxChars}
                </span>
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-bold",
                    booking?.bookingStatus === "Completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-700",
                  ].join(" ")}
                >
                  Status: {booking?.bookingStatus || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Partner card */}
          <div className="p-6 pb-0">
            <div className="rounded-3xl border bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border bg-white">
                  {partnerImageSrc ? (
                    <img
                      src={partnerImageSrc}
                      alt={partner?.profile?.name || "Partner"}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <Avatar
                      name={partner?.name || "Partner"}
                      image={partner?.profileImage || ""}
                      size={64}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500">
                    Assigned Partner
                  </p>
                  <p className="text-base font-extrabold text-slate-900">
                    {partner?.profile?.name ||
                      booking?.assignedPartnerName ||
                      "Partner"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Avg Rating:{" "}
                    {Number(partner?.partner?.averageRating || 0).toFixed(1)} |
                    Reviews: {partner?.partner?.totalReviews || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">
                    Your Rating
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Tap stars to change
                  </p>
                </div>

                <div className="mt-3 rounded-3xl border bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <StarRating
                      value={rating}
                      onChange={setRating}
                      size={34}
                      disabled={!canReview || saving}
                    />
                    <div className="text-sm font-extrabold text-slate-900">
                      {ratingLabel}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">
                    Write a review
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Minimum {minChars} characters
                  </p>
                </div>

                <div className="mt-2">
                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value.slice(0, maxChars))
                    }
                    rows={5}
                    disabled={!canReview || saving}
                    placeholder="Example: Partner arrived on time and completed the work professionally..."
                    className={[
                      "w-full rounded-3xl border p-4 text-sm outline-none transition",
                      "focus:ring-4 focus:ring-indigo-100",
                      commentOk ? "border-slate-200" : "border-amber-200",
                      !canReview || saving
                        ? "bg-slate-100 cursor-not-allowed"
                        : "",
                    ].join(" ")}
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <p
                      className={
                        commentOk
                          ? "text-xs text-slate-500"
                          : "text-xs text-amber-700"
                      }
                    >
                      {commentTrimmed.length < minChars
                        ? `Add ${minChars - commentTrimmed.length} more characters`
                        : "Looks good ✅"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {charCount}/{maxChars}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="rounded-2xl border bg-white px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className={[
                    "rounded-2xl px-6 py-3 text-sm font-extrabold text-white transition",
                    canSubmit
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "cursor-not-allowed bg-slate-300",
                  ].join(" ")}
                >
                  {saving ? "Submitting..." : "Submit Review"}
                </button>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4 text-xs text-slate-600">
                Tip: Keep it honest and short. Avoid sharing personal details.
              </div>
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
