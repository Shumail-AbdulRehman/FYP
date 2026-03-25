import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetLocationById } from "./queries";
import type { LocationStatsFilter } from "./queries";
import {
  MapPin,
  Building2,
  Clock,
  Users,
  ClipboardList,
  Navigation,
  Radius,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Activity,
  CalendarCheck,
  Calendar,
  RefreshCw,
} from "lucide-react";
import InfoCard, { InfoRow } from "./components/InfoCard";
import StatCard from "./components/StatCard";
import TaskStatusBadge from "./components/TaskStatusBadge";


const toDateStr = (d: Date) => d.toISOString().split("T")[0];

type FilterKey = "today" | "yesterday" | "7days" | "all";

const FILTERS: { key: FilterKey; label: string; toFilter: () => LocationStatsFilter | undefined }[] = [
  {
    key: "today",
    label: "Today",
    toFilter: () => {
      const t = toDateStr(new Date());
      return { type: "range", dateFrom: t, dateTo: t };
    },
  },
  {
    key: "yesterday",
    label: "Yesterday",
    toFilter: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const s = toDateStr(y);
      return { type: "range", dateFrom: s, dateTo: s };
    },
  },
  {
    key: "7days",
    label: "Last 7 Days",
    toFilter: () => ({ type: "days", days: 7 }),
  },
  {
    key: "all",
    label: "All Time",
    toFilter: () => undefined,
  },
];


type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NOT_COMPLETED_INTIME"
  | "MISSED"
  | "CANCELLED";

interface TaskStatEntry {
  status: TaskStatus;
  _count: { status: number };
}


const fmt = (d: string) => new Date(d).toLocaleString("en-US", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const fmtCoord = (v: string) => parseFloat(v).toFixed(6);

const LocationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("today");

  const currentFilter = FILTERS.find(f => f.key === activeFilter)!;
  const filter = currentFilter.toFilter();

  const { data, isLoading, isFetching } = useGetLocationById(id!, filter);

  const locationInfo = data?.data?.locationInfo;
  const taskStats: TaskStatEntry[] = data?.data?.taskStats ?? [];

  
  const staffCount      = locationInfo?.staff?.length ?? 0;
  const templateCount   = locationInfo?.taskTemplates?.length ?? 0;
  const instanceCount   = locationInfo?.taskInstances?.length ?? 0;
  const completedCount  = taskStats.find(t => t.status === "COMPLETED")?._count?.status ?? 0;

  
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Loading location details…</p>
        </div>
      </div>
    );
  }

  if (!locationInfo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-base font-semibold text-gray-700">Location not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">

      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Locations
      </button>

      
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <Calendar className="ml-1.5 h-4 w-4 text-gray-400 shrink-0" />
          {FILTERS.map((f) => {
            const isActive = f.key === activeFilter;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {isActive && isFetching && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                )}
                {f.label}
              </button>
            );
          })}
        </div>

        
        <p className="text-xs text-gray-400">
          Showing:{" "}
          <span className="font-medium text-gray-600">
            {FILTERS.find(f => f.key === activeFilter)?.label}
          </span>
        </p>
      </div>

      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-lg text-white">
        
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
         
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{locationInfo.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-blue-100">
                <Building2 className="h-3.5 w-3.5" />
                {locationInfo.address}
              </p>
            </div>
          </div>

          
          <span
            className={`self-start rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm ${
              locationInfo.isActive
                ? "bg-green-400/20 text-green-100 ring-1 ring-green-400/30"
                : "bg-rose-400/20 text-rose-100 ring-1 ring-rose-400/30"
            }`}
          >
            {locationInfo.isActive ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Inactive
              </span>
            )}
          </span>
        </div>

        
        <div className="relative mt-5 flex flex-wrap items-center gap-4 border-t border-white/20 pt-4 text-xs text-blue-100">
          <span className="flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5" />
            Lat: {fmtCoord(locationInfo.latitude)}
          </span>
          <span className="flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 rotate-90" />
            Lng: {fmtCoord(locationInfo.longitude)}
          </span>
          <span className="flex items-center gap-1.5">
            <Radius className="h-3.5 w-3.5" />
            Geofence radius: {locationInfo.radiusMeters} m
          </span>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Staff"          value={staffCount}     icon={Users}         color="blue"   />
        <StatCard label="Task Templates" value={templateCount}  icon={ClipboardList} color="purple" />
        <StatCard label="Task Instances" value={instanceCount}  icon={Activity}      color="cyan"   />
        <StatCard label="Completed"      value={completedCount} icon={CalendarCheck} color="green"  />
      </div>

     
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        <InfoCard title="Basic Info" icon={Building2} iconColor="text-blue-500">
          <InfoRow label="Location ID"   value={`#${locationInfo.id}`} />
          <InfoRow label="Company ID"    value={`#${locationInfo.companyId}`} />
          <InfoRow label="Created"       value={fmt(locationInfo.createdAt)} />
          <InfoRow label="Last Updated"  value={fmt(locationInfo.updatedAt)} />
        </InfoCard>

       
        <InfoCard title="Geo Details" icon={MapPin} iconColor="text-indigo-500">
          <InfoRow label="Latitude"       value={locationInfo.latitude} />
          <InfoRow label="Longitude"      value={locationInfo.longitude} />
          <InfoRow label="Radius (m)"     value={`${locationInfo.radiusMeters} meters`} />
          <InfoRow label="Maps Link"      value={
            <a
              href={`https://maps.google.com/?q=${locationInfo.latitude},${locationInfo.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open in Maps ↗
            </a>
          } />
        </InfoCard>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <Activity className="h-4 w-4 text-cyan-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Task Status Breakdown</h2>
        </div>
        {taskStats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
            {taskStats.map((entry) => (
              <TaskStatusBadge
                key={entry.status}
                status={entry.status}
                count={entry._count.status}
              />
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-gray-400">No task data available for this period.</p>
        )}
      </div>

     
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <Users className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
            Assigned Staff ({staffCount})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Shift Start</th>
                <th className="px-5 py-3 font-semibold">Shift End</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locationInfo.staff?.length > 0 ? locationInfo.staff.map((s: any) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-gray-500">{s.email}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.shiftStart ? new Date(s.shiftStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.shiftEnd ? new Date(s.shiftEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">No active staff assigned to this location.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <ClipboardList className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
            Task Templates ({templateCount})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Recurring</th>
                <th className="px-5 py-3 font-semibold">Effective Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locationInfo.taskTemplates?.length > 0 ? locationInfo.taskTemplates.map((t: any) => (
                <tr key={t.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{t.title}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{t.description || "-"}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                      {t.recurringType ?? "ONCE"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {t.effectiveDate ? new Date(t.effectiveDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">No active task templates for this location.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

     
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <Clock className="h-4 w-4 text-cyan-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
            Task Instances ({instanceCount})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Shift</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Late?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locationInfo.taskInstances?.length > 0 ? locationInfo.taskInstances.map((ti: any) => {
                const statusColors: Record<string, string> = {
                  PENDING:              "bg-gray-100 text-gray-600",
                  IN_PROGRESS:          "bg-blue-100 text-blue-700",
                  COMPLETED:            "bg-green-100 text-green-700",
                  NOT_COMPLETED_INTIME: "bg-amber-100 text-amber-700",
                  MISSED:               "bg-rose-100 text-rose-700",
                  CANCELLED:            "bg-slate-100 text-slate-600",
                };
                return (
                  <tr key={ti.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{ti.title}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(ti.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(ti.shiftStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(ti.shiftEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[ti.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {ti.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {ti.isLate
                        ? <span className="text-amber-600 font-semibold">+{ti.lateMinutes ?? "?"}m</span>
                        : <span className="text-green-600">On time</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">No task instances found for this location.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default LocationDetailPage;