import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetStaffDetails } from "./queries";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  ArrowLeft, User, Mail, MapPin, Clock, Calendar,
  ClipboardList, CheckCircle2, XCircle, AlertTriangle, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Tab = "overview" | "templates" | "instances" | "attendance";

const fmtTime = (d: string | null) => { if (!d) return "—"; return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
const fmtDate = (d: string | null) => { if (!d) return "—"; return new Date(d).toLocaleDateString(); };
const fmtDateTime = (d: string | null) => { if (!d) return "—"; return new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); };

function StatCard({ label, value, icon, color = "teal" }: { label: string; value: number | string; icon: React.ReactNode; color?: string; }) {
  const colorMap: Record<string, string> = {
    teal: "border-teal-200 text-teal-700", emerald: "border-emerald-200 text-emerald-700",
    amber: "border-amber-200 text-amber-700", red: "border-red-200 text-red-700", sky: "border-sky-200 text-sky-700",
  };
  const cls = colorMap[color] ?? colorMap.teal;
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${cls}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2.5">{icon}</div>
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
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Staff member not found.</p>
        <button onClick={() => navigate("/staff")} className="mt-3 text-teal-600 hover:underline text-sm">← Back to Staff</button>
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

  // Chart: task status distribution
  const taskChartData = [
    { name: "Completed", value: taskStats.completed, fill: "#10b981" },
    { name: "Pending", value: taskStats.pending, fill: "#6b7280" },
    { name: "In Progress", value: taskStats.inProgress, fill: "#0ea5e9" },
    { name: "Missed", value: taskStats.missed, fill: "#ef4444" },
    { name: "Late", value: taskStats.late, fill: "#f59e0b" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate("/staff")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-700">
              {staff.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {staff.email}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {staff.location?.name ?? "Unassigned"}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmtTime(staff.shiftStart)} – {fmtTime(staff.shiftEnd)}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={staff.isActive ? "ACTIVE" : "INACTIVE"} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Templates" value={taskStats.totalTemplates} icon={<ClipboardList className="h-5 w-5" />} color="teal" />
        <StatCard label="Completed" value={taskStats.completed} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
        <StatCard label="Pending" value={taskStats.pending} icon={<Activity className="h-5 w-5" />} color="sky" />
        <StatCard label="Missed" value={taskStats.missed} icon={<XCircle className="h-5 w-5" />} color="red" />
        <StatCard label="Late Check-ins" value={attendanceStats.late} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === t.key ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h2>
            <dl className="space-y-3 text-sm">
              {([["Name", staff.name], ["Email", staff.email], ["Role", staff.role], ["Location", staff.location?.name ?? "Unassigned"], ["Address", staff.location?.address ?? "—"], ["Shift", `${fmtTime(staff.shiftStart)} – ${fmtTime(staff.shiftEnd)}`], ["Joined", fmtDate(staff.createdAt)]] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between"><dt className="text-gray-400">{label}</dt><dd className="text-gray-700 text-right">{value}</dd></div>
              ))}
            </dl>
          </div>

          {/* Task Performance Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Task Performance</h2>
            {taskChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={taskChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: 13 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {taskChartData.map((entry, idx) => (
                      <React.Fragment key={idx}>
                        {/* @ts-ignore */}
                        <rect fill={entry.fill} />
                      </React.Fragment>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No task data</div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {([["Total", attendanceStats.totalRecords, "teal"], ["Present", attendanceStats.present, "emerald"], ["Absent", attendanceStats.absent, "red"], ["Late", attendanceStats.late, "amber"]] as [string, number, string][]).map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className={`text-xs mt-1 text-${color}-600`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div>
          {staff.taskTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mb-4" /><p className="text-sm text-gray-500">No task templates assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staff.taskTemplates.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{t.title}</h3>
                  {t.description && <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{t.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={t.recurringType ?? "ONCE"} /><StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} /></div>
                  <div className="mt-3 border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-gray-400">Location</p><p className="text-gray-700 font-medium">{t.location?.name ?? "—"}</p></div>
                    <div><p className="text-gray-400">Shift</p><p className="text-gray-700 font-medium">{fmtTime(t.shiftStart)} – {fmtTime(t.shiftEnd)}</p></div>
                    <div><p className="text-gray-400">Effective</p><p className="text-gray-700 font-medium">{fmtDate(t.effectiveDate)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "instances" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {staff.taskInstances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><Activity className="h-12 w-12 text-gray-400 mb-4" /><p className="text-sm text-gray-500">No task instances found.</p></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3">Task</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Shift</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Started</th><th className="px-5 py-3">Completed</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {staff.taskInstances.map((i: any) => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{i.title}</td>
                    <td className="px-5 py-3 text-gray-500">{i.location?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(i.date)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtTime(i.shiftStart)} – {fmtTime(i.shiftEnd)}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} />{i.isLate && <span className="ml-1.5 text-[10px] text-amber-600">LATE</span>}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDateTime(i.startedAt)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDateTime(i.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {staff.attendances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><Calendar className="h-12 w-12 text-gray-400 mb-4" /><p className="text-sm text-gray-500">No attendance records found.</p></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3">Date</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Expected Shift</th><th className="px-5 py-3">Check In</th><th className="px-5 py-3">Check Out</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Late</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {staff.attendances.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{fmtDate(a.date)}</td>
                    <td className="px-5 py-3 text-gray-500">{a.location?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtTime(a.expectedStart)} – {fmtTime(a.expectedEnd)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDateTime(a.checkInTime)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDateTime(a.checkOutTime)}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3">{a.isLateCheckIn ? <span className="text-xs text-amber-600">{a.lateMinutes ?? 0} min late</span> : <span className="text-xs text-gray-400">On time</span>}</td>
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
