import { MapPin, Users, ClipboardList, TrendingUp } from "lucide-react";
import { useGetDashboardLocations } from "./queries";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatusBadge from "@/components/common/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ── Stat Card ── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    teal:    { bg: "bg-teal-50",    text: "text-teal-700",    icon: "bg-teal-100 text-teal-600" },
    sky:     { bg: "bg-sky-50",     text: "text-sky-700",     icon: "bg-sky-100 text-sky-600" },
    violet:  { bg: "bg-violet-50",  text: "text-violet-700",  icon: "bg-violet-100 text-violet-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
  };
  const c = colorMap[color] ?? colorMap.teal;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold text-gray-900`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ── Chart colors ── */
const CHART_COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();
  const { data, isLoading } = useGetDashboardLocations();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const locations = data?.data ?? [];

  const totalLocations = locations.length;
  const totalStaff = locations.reduce(
    (sum: number, l: any) => sum + (l._count?.staff ?? 0), 0
  );
  const totalTemplates = locations.reduce(
    (sum: number, l: any) => sum + (l._count?.taskTemplates ?? 0), 0
  );

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Chart data: staff & templates per location
  const barData = locations.map((l: any) => ({
    name: l.name.length > 15 ? l.name.slice(0, 15) + "…" : l.name,
    staff: l._count?.staff ?? 0,
    templates: l._count?.taskTemplates ?? 0,
  }));

  // Pie: staff distribution
  const pieData = locations
    .filter((l: any) => (l._count?.staff ?? 0) > 0)
    .map((l: any) => ({
      name: l.name,
      value: l._count?.staff ?? 0,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? "Manager"}`}
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Locations" value={totalLocations} icon={MapPin} color="teal" />
        <StatCard label="Active Staff" value={totalStaff} icon={Users} color="sky" />
        <StatCard label="Task Templates" value={totalTemplates} icon={ClipboardList} color="violet" />
        <StatCard label="Completion Rate" value="—" icon={TrendingUp} color="emerald" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart: Staff & Templates per Location */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Staff & Templates by Location</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: 13 }}
                />
                <Bar dataKey="staff" fill="#0d9488" radius={[4, 4, 0, 0]} name="Staff" />
                <Bar dataKey="templates" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Templates" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Pie Chart: Staff Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Staff Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No staff assigned</div>
          )}
        </div>
      </div>

      {/* Locations Quick View */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Your Locations
          </h2>
          <button
            onClick={() => navigate("/locations")}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Address</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Staff</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Templates</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.map((loc: any) => (
                <tr
                  key={loc.id}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                        <MapPin className="h-4 w-4 text-teal-600" />
                      </div>
                      <span className="font-medium text-gray-800">{loc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{loc.address}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{loc._count?.staff ?? 0}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{loc._count?.taskTemplates ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={loc.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
