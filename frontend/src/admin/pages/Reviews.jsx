import React, { useEffect, useMemo, useState } from "react";
import { adminDeleteReviewApi, adminGetReviewsApi } from "../../services/api";
import StarRating from "../../components/StarRating";
import Swal from "sweetalert2";
import {
  Search,
  Trash2,
  Star,
  User,
  Wrench,
  CalendarDays,
  MessageSquareText,
  BadgeCheck,
} from "lucide-react";

const safe = (v, fallback = "—") => (v ? v : fallback);

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (String(d) === "Invalid Date") return "—";
  return d.toLocaleString();
};

const getUserName = (review) =>
  review?.user?.profile?.name ||
  review?.booking?.customerName ||
  review?.customerName ||
  "Unknown User";

const getUserEmail = (review) =>
  review?.user?.email ||
  review?.booking?.customerEmail ||
  review?.customerEmail ||
  "No Email";

const getPartnerName = (review) =>
  review?.partner?.profile?.name ||
  review?.partner?.email?.split("@")[0] ||
  "Partner";

export default function Reviews() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminGetReviewsApi(p, 20);

      setItems(res?.data?.items || []);
      setPage(res?.data?.page || 1);
      setPages(res?.data?.pages || 1);
      setTotal(res?.data?.total || 0);
    } catch (e) {
      console.log("admin reviews error", e);
      Swal.fire("Error", "Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const filteredItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((r) => {
      const serviceTitle = String(r?.service?.title || "").toLowerCase();
      const userName = String(getUserName(r)).toLowerCase();
      const userEmail = String(getUserEmail(r)).toLowerCase();
      const partnerName = String(getPartnerName(r)).toLowerCase();
      const comment = String(r?.comment || "").toLowerCase();
      const bookingId = String(r?.booking?._id || r?.booking || "").toLowerCase();

      return (
        serviceTitle.includes(s) ||
        userName.includes(s) ||
        userEmail.includes(s) ||
        partnerName.includes(s) ||
        comment.includes(s) ||
        bookingId.includes(s)
      );
    });
  }, [items, q]);

  const del = async (id) => {
    const result = await Swal.fire({
      title: "Delete this review?",
      text: "This review will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      await adminDeleteReviewApi(id);

      await Swal.fire({
        title: "Deleted",
        text: "Review has been deleted successfully.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      const nextPage =
        items.length === 1 && page > 1 ? page - 1 : page;

      load(nextPage);
    } catch (error) {
      Swal.fire("Error", "Failed to delete review", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage customer reviews for completed partner bookings.
              </p>
              <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Total Reviews: {total}
              </p>
            </div>

            <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by service, customer, partner, booking..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading reviews...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <MessageSquareText className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              No reviews found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or check a different page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((r) => (
              <div
                key={r._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        <Wrench className="h-3.5 w-3.5" />
                        {safe(r?.service?.title, "Service")}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <Star className="h-3.5 w-3.5" />
                        {Number(r?.rating || 0).toFixed(1)} / 5
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Visible
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Customer
                        </p>
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-white p-2 shadow-sm">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {getUserName(r)}
                            </p>
                            <p className="truncate text-sm text-slate-600">
                              {getUserEmail(r)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Assigned Partner
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {getPartnerName(r)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {safe(r?.partner?.email, "No Email")}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Booking
                        </p>
                        <p className="break-all text-sm font-semibold text-slate-800">
                          {safe(r?.booking?._id || r?.booking, "No Booking")}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Status: {safe(r?.booking?.bookingStatus, "—")}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Submitted On
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays className="h-4 w-4 text-slate-500" />
                          {formatDateTime(r?.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Review Comment
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {safe(r?.comment, "No comment")}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-4 xl:items-end">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Rating
                      </p>
                      <StarRating value={r?.rating || 0} readOnly />
                    </div>

                    <button
                      onClick={() => del(r._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
            className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm font-medium text-slate-600">
            Page {page} of {pages}
          </p>

          <button
            disabled={page >= pages || loading}
            onClick={() => load(page + 1)}
            className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}