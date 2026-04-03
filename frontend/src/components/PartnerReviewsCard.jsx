import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Star, User2 } from "lucide-react";
import { getPartnerReviewsApi } from "../services/api";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAvatarUrl(item) {
  const raw =
    item?.user?.image ||
    item?.user?.avatar ||
    item?.user?.profileImage ||
    item?.user?.photo ||
    "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `http://localhost:5000${raw}`;
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Stars({ value = 0 }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={
            n <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function PartnerReviewsCard({ partner }) {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!partner?._id) {
      setReviews([]);
      setAverageRating(0);
      setCount(0);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        const res = await getPartnerReviewsApi(partner._id);

        if (ignore) return;

        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setReviews(items);
        setAverageRating(Number(res?.data?.averageRating || 0));
        setCount(Number(res?.data?.count || items.length || 0));
      } catch (e) {
        console.log("getPartnerReviewsApi error:", e);
        if (!ignore) {
          setReviews([]);
          setAverageRating(0);
          setCount(0);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [partner?._id]);

  const topReviews = useMemo(() => reviews.slice(0, 4), [reviews]);

  if (!partner?._id) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-indigo-50">
            <MessageSquare className="text-indigo-600" size={20} />
          </div>
          <div>
            <p className="font-extrabold text-gray-900">Partner Reviews</p>
            <p className="text-sm text-gray-600">
              Select a partner to view ratings and customer feedback.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-600">
          No partner selected yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900">Partner Reviews</p>
          <p className="mt-1 text-sm text-gray-600">
            Feedback from other users for{" "}
            <span className="font-bold text-gray-900">
              {partner?.name || "this partner"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-right">
          <p className="text-lg font-extrabold text-amber-700">
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </p>
          <p className="text-[11px] font-bold text-amber-700/80">
            {count} review{count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-600">
          Loading partner reviews...
        </div>
      ) : topReviews.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
          <MessageSquare className="mx-auto text-gray-300" size={26} />
          <p className="mt-2 font-bold text-gray-800">No reviews yet</p>
          <p className="mt-1 text-sm text-gray-600">
            This partner does not have any public reviews yet.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {topReviews.map((item) => {
            const avatar = getAvatarUrl(item);
            const userName = item?.user?.name || "User";

            return (
              <div
                key={item?._id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-sm font-extrabold text-indigo-700">
                        {getInitials(userName)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item?.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Stars value={item?.rating || 0} />
                      </div>
                    </div>

                    {item?.service?.title ? (
                      <p className="mt-2 text-xs font-bold text-indigo-700">
                        {item.service.title}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {String(item?.comment || "").trim() ||
                        "Very good service experience."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {count > 4 ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-bold text-indigo-700">
              Showing recent 4 reviews
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}