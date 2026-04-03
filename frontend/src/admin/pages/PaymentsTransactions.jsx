import React, { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { adminGetPaymentsApi } from "../../services/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PaymentMethodBadge({ method }) {
  const val = String(method || "").toLowerCase();

  const style =
    val === "razorpay"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : val === "upi"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : val === "card"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : val === "cash"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        style
      )}
    >
      {method || "N/A"}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const val = String(status || "").toLowerCase();

  const style =
    val === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : val === "failed"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : val === "refunded"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        style
      )}
    >
      {status || "N/A"}
    </span>
  );
}

export default function PaymentsTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const loadPayments = async ({
    pageArg = page,
    limitArg = limit,
    searchArg = search,
    methodArg = method,
    statusArg = status,
  } = {}) => {
    try {
      setLoading(true);

      const res = await adminGetPaymentsApi({
        page: pageArg,
        limit: limitArg,
        search: searchArg,
        method: methodArg,
        status: statusArg,
      });

      const data = res?.data || {};

      setItems(data.items || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setLimit(data.limit || 10);
    } catch (error) {
      console.error("admin payments error:", error);
      setItems([]);
      setPage(1);
      setPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments({
      pageArg: 1,
      limitArg: limit,
      searchArg: search,
      methodArg: method,
      statusArg: status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, method, status, limit]);

  const totalAmountOnPage = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleReset = () => {
    setSearch("");
    setSearchInput("");
    setMethod("all");
    setStatus("all");
    setPage(1);
  };

  const handlePrev = () => {
    if (page <= 1) return;
    loadPayments({ pageArg: page - 1 });
  };

  const handleNext = () => {
    if (page >= pages) return;
    loadPayments({ pageArg: page + 1 });
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* header */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payments & Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dynamic payment records from bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            onClick={() => loadPayments()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">This Page Records</span>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{items.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Records</span>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">This Page Amount</span>
            <IndianRupee className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalAmountOnPage)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">Current Filter</span>
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {method === "all" ? "All Methods" : method} /{" "}
            {status === "all" ? "All Status" : status}
          </div>
        </div>
      </div>

      {/* search + filters */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full max-w-xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by user, txn id, phone, service..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </form>

          <select
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => {
                  setPage(1);
                  setMethod(e.target.value);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                <option value="all">All</option>
                <option value="Razorpay">Razorpay</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                <option value="all">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleReset}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">User</th>
                <th className="px-4 py-4 text-left font-semibold">Transaction ID</th>
                <th className="px-4 py-4 text-left font-semibold">Mobile Number</th>
                <th className="px-4 py-4 text-left font-semibold">Service</th>
                <th className="px-4 py-4 text-left font-semibold">Amount</th>
                <th className="px-4 py-4 text-left font-semibold">Payment Method</th>
                <th className="px-4 py-4 text-left font-semibold">Payment Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {p.user}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                      {p.txnId}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{p.mobile}</td>
                    <td className="px-4 py-4 text-slate-700">{p.service}</td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentMethodBadge method={p.method} />
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={p.paymentStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            Rows per page:{" "}
            <span className="font-semibold text-slate-700">{limit}</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {from}–{to} of {total}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="min-w-[72px] text-center font-semibold text-slate-700">
                {page} / {pages}
              </div>

              <button
                onClick={handleNext}
                disabled={page >= pages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}