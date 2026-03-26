import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetStaffDetails } from "./queries";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Clock,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";

type Tab = "overview" | "templates" | "instances" | "attendance";

const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
};

const fmtDateTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/* KPI Card */
function StatCard({ label, value, icon, color = "indigo" }: {
  label: string; value: number | string; icon: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
    red: "from-red-500/10 to-red-500/5 border-red-500/20 text-red-400",
    sky: "from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-400",
  };
  const cls = colorMap[color] ?? colorMap.indigo;
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${cls}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">{icon}</div>
      </div>
    </div>
  );
}

const StaffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data, isLoading } = useGetStaffDetails(Number(id));

  if (isLoading) return <LoadingSpinner fullScreen />;

  const staff = data?.data;
  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="h-12 w-12 text-slate-500 mb-4" />
        <p className="text-slate-400">Staff member not found.</p>
        <button onClick={() => navigate("/staff")} className="mt-3 text-indigo-400 hover:underline text-sm">
          ← Back to Staff
        </button>
      </div>
    );
  }

  const { taskStats, attendanceStats } = staff;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "templates", label: "Templates", count: taskStats.totalTemplates },
    { key: "instances", label: "Task Instances", count: taskStats.totalInstances },
    { key: "attendance", label: "Attendance", count: attendanceStats.totalRecords },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate("/staff")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl font-bold text-indigo-400">
              {staff.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{staff.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {staff.email}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {staff.location?.name ?? "Unassigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {fmtTime(staff.shiftStart)} – {fmtTime(staff.shiftEnd)}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={staff.isActive ? "ACTIVE" : "INACTIVE"} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Templates" value={taskStats.totalTemplates} icon={<ClipboardList className="h-5 w-5" />} color="indigo" />
        <StatCard label="Completed" value={taskStats.completed} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
        <StatCard label="Pending" value={taskStats.pending} icon={<Activity className="h-5 w-5" />} color="sky" />
        <StatCard label="Missed" value={taskStats.missed} icon={<XCircle className="h-5 w-5" />} color="red" />
        <StatCard label="Late Check-ins" value={attendanceStats.late} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-700/60 bg-slate-900 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile Info */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Profile Information</h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Name", staff.name],
                ["Email", staff.email],
                ["Role", staff.role],
                ["Location", staff.location?.name ?? "Unassigned"],
                ["Location Address", staff.location?.address ?? "—"],
                ["Shift", `${fmtTime(staff.shiftStart)} – ${fmtTime(staff.shiftEnd)}`],
                ["Joined", fmtDate(staff.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-300 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Task Performance */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Task Performance</h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Assigned Templates", taskStats.totalTemplates],
                ["Total Instances", taskStats.totalInstances],
                ["Completed", taskStats.completed],
                ["In Progress", taskStats.inProgress],
                ["Pending", taskStats.pending],
                ["Missed", taskStats.missed],
                ["Late Completions", taskStats.late],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-300 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Attendance Summary */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-white mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Total Records", attendanceStats.totalRecords, "indigo"],
                ["Present", attendanceStats.present, "emerald"],
                ["Absent", attendanceStats.absent, "red"],
                ["Late", attendanceStats.late, "amber"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="rounded-lg border border-slate-700/40 bg-slate-800/50 p-4 text-center">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className={`text-xs mt-1 text-${color}-400`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div>
          {staff.taskTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900 py-16 text-center">
              <ClipboardList className="h-12 w-12 text-slate-500 mb-4" />
              <p className="text-sm text-slate-400">No task templates assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staff.taskTemplates.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-slate-700/60 bg-slate-900 p-5 transition-all hover:border-slate-600">
                  <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                  {t.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={t.recurringType ?? "ONCE"} />
                    <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <div className="mt-3 border-t border-slate-700/40 pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Location</p>
                      <p className="text-slate-300 font-medium">{t.location?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Shift</p>
                      <p className="text-slate-300 font-medium">{fmtTime(t.shiftStart)} – {fmtTime(t.shiftEnd)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Effective</p>
                      <p className="text-slate-300 font-medium">{fmtDate(t.effectiveDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "instances" && (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900">
          {staff.taskInstances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-12 w-12 text-slate-500 mb-4" />
              <p className="text-sm text-slate-400">No task instances found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Shift</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Started</th>
                  <th className="px-5 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {staff.taskInstances.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{i.title}</td>
                    <td className="px-5 py-3 text-slate-400">{i.location?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDate(i.date)}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtTime(i.shiftStart)} – {fmtTime(i.shiftEnd)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={i.status} />
                      {i.isLate && <span className="ml-1.5 text-[10px] text-amber-400">LATE</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmtDateTime(i.startedAt)}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDateTime(i.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900">
          {staff.attendances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-12 w-12 text-slate-500 mb-4" />
              <p className="text-sm text-slate-400">No attendance records found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Expected Shift</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Check Out</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {staff.attendances.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{fmtDate(a.date)}</td>
                    <td className="px-5 py-3 text-slate-400">{a.location?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtTime(a.expectedStart)} – {fmtTime(a.expectedEnd)}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDateTime(a.checkInTime)}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDateTime(a.checkOutTime)}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3">
                      {a.isLateCheckIn ? (
                        <span className="text-xs text-amber-400">{a.lateMinutes ?? 0} min late</span>
                      ) : (
                        <span className="text-xs text-slate-500">On time</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDetailPage;
