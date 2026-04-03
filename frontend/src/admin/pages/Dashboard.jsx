import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Wrench,
  IndianRupee,
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Clock3,
  PackageCheck,
  BadgePercent,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getDashboardSummaryApi } from "../../services/api";

/** ---------- helpers ---------- */
function formatK(n) {
  const num = Number(n || 0);
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "Cr";
  if (num >= 100000) return (num / 100000).toFixed(1) + "L";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return String(num);
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

function percent(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.round((p / t) * 100));
}

const COLORS = [
  "#4f46e5",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
];

/** ---------- small UI components ---------- */
function Card({ title, right, children, className = "" }) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>
      {title || right ? (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title ? (
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            ) : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}

function PillTabs({ value, onChange, items }) {
  return (
    <div className="inline-flex rounded-full border bg-gray-50 p-1">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-white shadow-sm text-indigo-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, sub, icon, trend }) {
  const isUp = trend?.direction === "up";
  const isDown = trend?.direction === "down";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>

          <div className="mt-2 flex items-center gap-2">
            {trend ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  isUp
                    ? "bg-emerald-50 text-emerald-700"
                    : isDown
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {isUp ? (
                  <TrendingUp size={14} />
                ) : isDown ? (
                  <TrendingDown size={14} />
                ) : null}
                {trend.value}
              </span>
            ) : null}

            <span className="text-xs text-gray-500">{sub}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-gray-900">{p?.name}</p>
      <p className="text-gray-600">
        Bookings: <span className="font-semibold">{p?.value ?? 0}</span>
      </p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-gray-600">
        Revenue:{" "}
        <span className="font-semibold">
          ₹{formatK(payload[0]?.value || 0)}
        </span>
      </p>
    </div>
  );
}

function ProgressRow({ label, value, total, colorClass = "bg-indigo-600" }) {
  const pct = percent(value, total);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-sm font-extrabold text-gray-900">
          {formatK(value)}
          <span className="ml-1 text-xs font-medium text-gray-500">
            ({pct}%)
          </span>
        </p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** ---------- main ---------- */
export default function Dashboard() {
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState(null);
  const [charts, setCharts] = useState({
    revenueData: [],
    serviceData: [],
    topPartners: [],
  });

  const load = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError("");

      const res = await getDashboardSummaryApi({ range: selectedRange });

      setCounts(res?.data?.counts || {});
      setCharts(
        res?.data?.charts || {
          revenueData: [],
          serviceData: [],
          topPartners: [],
        },
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const c = counts || {
    totalBookings: 0,
    filteredBookings: 0,
    pendingBookings: 0,
    totalUsers: 0,
    activeServices: 0,
    activePartners: 0,
    totalRevenue: 0,
    totalServices: 0,
    activeOffers: 0,
  };

  const serviceData = useMemo(() => safeArray(charts?.serviceData), [charts]);
  const revenueData = useMemo(() => safeArray(charts?.revenueData), [charts]);
  const topPartners = useMemo(() => safeArray(charts?.topPartners), [charts]);

  const calculatedFilteredBookings = useMemo(() => {
    return serviceData.reduce((sum, item) => sum + Number(item?.value || 0), 0);
  }, [serviceData]);

  const displayFilteredBookings = useMemo(() => {
    const backendValue = Number(c?.filteredBookings || 0);
    const chartValue = Number(calculatedFilteredBookings || 0);
    return chartValue > 0 ? chartValue : backendValue;
  }, [c?.filteredBookings, calculatedFilteredBookings]);

  const topServiceList = useMemo(() => {
    return [...serviceData]
      .map((x) => ({
        name: x?.name || "Service",
        value: Number(x?.value || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [serviceData]);

  const rangeLabel =
    range === "week"
      ? "This Week"
      : range === "month"
        ? "This Month"
        : "This Year";

  const revenueXAxisKey = range === "year" ? "month" : "day";
  const hasRevenueData = revenueData.some(
    (item) => Number(item?.value || 0) > 0,
  );

  const completedBookings = Math.max(
    0,
    Number(c.totalBookings || 0) - Number(c.pendingBookings || 0),
  );

  const bookingInsightCards = [
    {
      title: "Pending Bookings",
      value: c.pendingBookings ?? 0,
      icon: <Clock3 size={18} />,
      bg: "bg-amber-50 text-amber-700",
    },
    {
      title: "Completed / Managed",
      value: completedBookings,
      icon: <PackageCheck size={18} />,
      bg: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Active Services",
      value: c.activeServices ?? 0,
      icon: <Activity size={18} />,
      bg: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active Offers",
      value: c.activeOffers ?? 0,
      icon: <BadgePercent size={18} />,
      bg: "bg-pink-50 text-pink-700",
    },
  ];

  const stats = useMemo(() => {
    return [
      {
        title: "Total Services Booked",
        value: formatK(c.totalBookings),
        sub: `${rangeLabel}: ${formatK(displayFilteredBookings)}`,
        icon: <Briefcase />,
        trend: { direction: "up", value: "+20%" },
      },
      {
        title: "Active Users",
        value: formatK(c.totalUsers),
        sub: "Than last week",
        icon: <Users />,
        trend: { direction: "up", value: "+8%" },
      },
      {
        title: "Active Service Partners",
        value: formatK(c.activePartners),
        sub: "Than last week",
        icon: <Wrench />,
        trend: { direction: "down", value: "-16%" },
      },
      {
        title: "Total Revenue",
        value: "₹" + formatK(c.totalRevenue),
        sub: rangeLabel,
        icon: <IndianRupee />,
        trend: { direction: "up", value: "+48%" },
      },
    ];
  }, [c, rangeLabel, displayFilteredBookings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of bookings, revenue, services and partners
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PillTabs
              value={range}
              onChange={setRange}
              items={[
                { label: "This Week", value: "week" },
                { label: "This Month", value: "month" },
                { label: "This Year", value: "year" },
              ]}
            />

            <button
              onClick={() => load(range)}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard
              key={i}
              title={s.title}
              value={s.value}
              sub={s.sub}
              icon={s.icon}
              trend={s.trend}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Top Performing Services"
            right={
              <PillTabs
                value={range}
                onChange={setRange}
                items={[
                  { label: "This Week", value: "week" },
                  { label: "This Month", value: "month" },
                  { label: "This Year", value: "year" },
                ]}
              />
            }
          >
            {loading ? (
              <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {serviceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-600">Services</p>

                  <div className="mt-3 space-y-3">
                    {topServiceList.length === 0 ? (
                      <p className="text-sm text-gray-500">No data</p>
                    ) : (
                      topServiceList.map((s, i) => (
                        <div
                          key={s.name + i}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <p className="break-words text-sm font-semibold text-gray-800">
                              {s.name}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-extrabold text-gray-900">
                            {formatK(s.value)}
                            <span className="ml-1 text-xs font-semibold text-gray-500">
                              bookings
                            </span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border bg-white p-3 text-sm">
                    <p className="text-gray-600">
                      Total Bookings:{" "}
                      <span className="font-extrabold text-gray-900">
                        {formatK(c.totalBookings)}
                      </span>
                    </p>

                    <p className="mt-1 text-gray-600">
                      {rangeLabel}:{" "}
                      <span className="font-extrabold text-indigo-700">
                        {formatK(displayFilteredBookings)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Revenue Overview"
            right={
              <PillTabs
                value={range}
                onChange={setRange}
                items={[
                  { label: "This Week", value: "week" },
                  { label: "This Month", value: "month" },
                  { label: "This Year", value: "year" },
                ]}
              />
            }
          >
            {loading ? (
              <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ) : !hasRevenueData ? (
              <div className="flex h-72 items-center justify-center rounded-2xl border bg-gray-50 text-sm text-gray-500">
                No revenue data found for {rangeLabel.toLowerCase()}.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={revenueXAxisKey}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Booking & Business Overview"
            right={
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {rangeLabel}
              </span>
            }
          >
            {loading ? (
              <div className="space-y-4">
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {bookingInsightCards.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            {item.title}
                          </p>
                          <p className="mt-2 text-2xl font-extrabold text-gray-900">
                            {formatK(item.value)}
                          </p>
                        </div>
                        <div className={`rounded-2xl p-3 ${item.bg}`}>
                          {item.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Booking Distribution
                  </p>

                  <div className="mt-4 space-y-4">
                    <ProgressRow
                      label="Pending"
                      value={c.pendingBookings}
                      total={c.totalBookings}
                      colorClass="bg-amber-500"
                    />
                    <ProgressRow
                      label="Completed / Managed"
                      value={completedBookings}
                      total={c.totalBookings}
                      colorClass="bg-emerald-500"
                    />
                    <ProgressRow
                      label="Active Partners Capacity"
                      value={c.activePartners}
                      total={Math.max(c.activePartners, c.totalUsers || 1)}
                      colorClass="bg-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Top Service Partners"
            right={
              <button className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-gray-50">
                View All
              </button>
            }
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : topPartners.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                No partner data found.
              </div>
            ) : (
              <div className="space-y-3">
                {topPartners.slice(0, 5).map((p, idx) => (
                  <div
                    key={p?._id || idx}
                    className="flex items-center justify-between rounded-2xl border bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 font-extrabold text-indigo-700">
                        {(p?.name || "P")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">
                          {p?.name || "Partner"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p?.category || "Service Partner"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-900">
                        {formatK(p?.completed || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">
                Quick Summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Services</span>
                  <span className="font-extrabold text-gray-900">
                    {formatK(c.totalServices ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Offers</span>
                  <span className="font-extrabold text-gray-900">
                    {formatK(c.activeOffers ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Bookings</span>
                  <span className="font-extrabold text-gray-900">
                    {formatK(c.pendingBookings ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}