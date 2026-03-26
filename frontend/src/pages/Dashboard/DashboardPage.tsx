import { MapPin, Users, ClipboardList, TrendingUp } from "lucide-react";
import { useGetDashboardLocations } from "./queries";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatusBadge from "@/components/common/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/20 text-indigo-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    purple: "bg-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            colorMap[color] ?? colorMap.indigo
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();
  const { data, isLoading } = useGetDashboardLocations();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const locations = data?.data ?? [];

  const totalLocations = locations.length;
  const totalStaff = locations.reduce(
    (sum: number, l: any) => sum + (l._count?.staff ?? 0),
    0
  );
  const totalTemplates = locations.reduce(
    (sum: number, l: any) => sum + (l._count?.taskTemplates ?? 0),
    0
  );

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? "Manager"}`}
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Locations"
          value={totalLocations}
          icon={MapPin}
          color="indigo"
        />
        <StatCard
          label="Active Staff"
          value={totalStaff}
          icon={Users}
          color="cyan"
        />
        <StatCard
          label="Task Templates"
          value={totalTemplates}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          label="Completion Rate"
          value="—"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Locations Quick View */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Your Locations
          </h2>
          <button
            onClick={() => navigate("/locations")}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Address
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Staff
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Templates
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {locations.map((loc: any) => (
                <tr
                  key={loc.id}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20">
                        <MapPin className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="font-medium text-white">
                        {loc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{loc.address}</td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {loc._count?.staff ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {loc._count?.taskTemplates ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      status={loc.isActive ? "ACTIVE" : "INACTIVE"}
                    />
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
