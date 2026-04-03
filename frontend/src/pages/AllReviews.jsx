import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLatestReviewsApi } from "../services/api";
import StarRating from "../components/StarRating";
import {
  ArrowLeft,
  MessageSquareText,
  User,
  Wrench,
  BadgeCheck,
  Search,
} from "lucide-react";

const safe = (v, fallback = "—") => (v ? v : fallback);

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (String(d) === "Invalid Date") return "—";
  return d.toLocaleString();
};

const getCustomerName = (r) =>
  r?.user?.profile?.name ||
  r?.booking?.customerName ||
  r?.customerName ||
  "Customer";

const getPartnerName = (r) =>
  r?.partner?.profile?.name ||
  r?.partner?.email?.split("@")[0] ||
  "Partner";

export default function AllReviews() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // load more than 3 so page looks good
        const res = await getLatestReviewsApi(50);
        setItems(res?.data?.items || []);
      } catch (e) {
        console.log("all reviews error", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((r) => {
      const serviceTitle = String(r?.service?.title || "").toLowerCase();
      const comment = String(r?.comment || "").toLowerCase();
      const customer = String(getCustomerName(r)).toLowerCase();
      const partner = String(getPartnerName(r)).toLowerCase();

      return (
        serviceTitle.includes(s) ||
        comment.includes(s) ||
        customer.includes(s) ||
        partner.includes(s)
      );
    });
  }, [items, q]);

  const visibleItems = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              All Reviews
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              See what customers are saying about services and partners.
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by service, customer, partner, or review..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading reviews...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <MessageSquareText className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              No reviews found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((r) => (
              <div
                key={r._id}
                className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        <Wrench className="h-3.5 w-3.5" />
                        {safe(r?.service?.title, "Service")}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Completed Booking Review
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Customer
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {getCustomerName(r)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {safe(r?.user?.email, r?.customerEmail || "No Email")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Partner
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {getPartnerName(r)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {safe(r?.partner?.email, "No Email")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Review
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {safe(r?.comment, "No review text")}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      {formatDateTime(r?.createdAt)}
                    </p>
                  </div>

                  <div className="flex min-w-[180px] flex-col items-start gap-2 lg:items-end">
                    <StarRating value={r?.rating || 0} readOnly />
                    <p className="text-lg font-extrabold text-slate-900">
                      {Number(r?.rating || 0).toFixed(1)}/5
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 6 && (
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => setVisibleCount(6)}
              disabled={visibleCount <= 6}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Show less
            </button>

            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              disabled={visibleCount >= filtered.length}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}