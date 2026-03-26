import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGetLocationById } from "./queries";
import type { LocationStatsFilter } from "./queries";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useDeleteTaskTemplate, useEditTaskTemplate } from "@/pages/Task/queries";
import { useAssignStaffToTemplate } from "@/pages/Assignment/queries";
import {
  MapPin,
  Building2,
  Clock,
  Users,
  ClipboardList,
  Navigation,
  Radius,
  XCircle,
  Activity,
  CalendarCheck,
  Calendar,
  RefreshCw,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";

/* ── helpers ── */
const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const fmtCoord = (v: string) => parseFloat(v).toFixed(6);
const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ── filters ── */
type FilterKey = "today" | "yesterday" | "7days" | "all";
const FILTERS: { key: FilterKey; label: string; toFilter: () => LocationStatsFilter | undefined }[] = [
  { key: "today", label: "Today", toFilter: () => { const t = toDateStr(new Date()); return { type: "range", dateFrom: t, dateTo: t }; } },
  { key: "yesterday", label: "Yesterday", toFilter: () => { const y = new Date(); y.setDate(y.getDate() - 1); const s = toDateStr(y); return { type: "range", dateFrom: s, dateTo: s }; } },
  { key: "7days", label: "Last 7 Days", toFilter: () => ({ type: "days", days: 7 }) },
  { key: "all", label: "All Time", toFilter: () => undefined },
];

/* ── stat card (local) ── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/20 text-indigo-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    purple: "bg-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
  };
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color] ?? colors.indigo}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ── tabs ── */
type Tab = "staff" | "templates" | "instances";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "staff", label: "Staff", icon: Users },
  { key: "templates", label: "Task Templates", icon: ClipboardList },
  { key: "instances", label: "Task Instances", icon: Clock },
];

interface TaskStatEntry { status: string; _count: { status: number } }

/* ── Templates Tab Component ── */
function TemplatesTab({ templates, staffList }: { templates: any[]; staffList: any[] }) {
  const deleteTemplate = useDeleteTaskTemplate();
  const editTemplate = useEditTaskTemplate();
  const assignStaff = useAssignStaffToTemplate();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    staffId: "" as string,
    shiftStart: "",
    shiftEnd: "",
    recurringType: "" as string,
    effectiveDate: "",
  });

  const handleDelete = (t: any) => {
    setOpenMenu(null);
    if (confirm(`Delete "${t.title}"? This will cancel all pending task instances.`)) {
      deleteTemplate.mutate(t.id);
    }
  };

  // Format ISO datetime to "HH:mm" for input[type=time]
  const toTimeValue = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Format ISO date to "YYYY-MM-DD" for input[type=date]
  const toDateValue = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  const handleEditOpen = (t: any) => {
    setOpenMenu(null);
    setEditError(null);
    setEditingTemplate(t);
    setEditForm({
      title: t.title,
      description: t.description || "",
      staffId: t.staffId ? String(t.staffId) : "",
      shiftStart: toTimeValue(t.shiftStart),
      shiftEnd: toTimeValue(t.shiftEnd),
      recurringType: t.recurringType || "",
      effectiveDate: toDateValue(t.effectiveDate),
    });
  };

  const extractError = (err: any) =>
    err?.response?.data?.message ||
    err?.response?.data?.errors?.map((e: any) => e.message).join(", ") ||
    err?.message ||
    "An unknown error occurred";

  const handleEditSave = async () => {
    if (!editingTemplate) return;
    setEditError(null);

    // 1) Build template-edit payload (everything except staffId)
    const payload: Record<string, any> = {};
    if (editForm.title !== editingTemplate.title) payload.title = editForm.title;
    if (editForm.description !== (editingTemplate.description || "")) payload.description = editForm.description || undefined;
    if (editForm.recurringType && editForm.recurringType !== editingTemplate.recurringType) {
      payload.recurringType = editForm.recurringType;
    }
    if (editForm.shiftStart && editForm.shiftStart !== toTimeValue(editingTemplate.shiftStart)) {
      const base = new Date(editingTemplate.shiftStart);
      const [h, m] = editForm.shiftStart.split(":").map(Number);
      base.setHours(h, m, 0, 0);
      payload.shiftStart = base.toISOString();
    }
    if (editForm.shiftEnd && editForm.shiftEnd !== toTimeValue(editingTemplate.shiftEnd)) {
      const base = new Date(editingTemplate.shiftEnd);
      const [h, m] = editForm.shiftEnd.split(":").map(Number);
      base.setHours(h, m, 0, 0);
      payload.shiftEnd = base.toISOString();
    }
    if (editForm.effectiveDate && editForm.effectiveDate !== toDateValue(editingTemplate.effectiveDate)) {
      payload.effectiveDate = new Date(editForm.effectiveDate).toISOString();
    }

    // 2) Check if staff assignment changed
    const staffChanged = editForm.staffId !== String(editingTemplate.staffId ?? "");
    const hasFieldChanges = Object.keys(payload).length > 0;

    try {
      // Save template field changes first (if any)
      if (hasFieldChanges) {
        await new Promise<void>((resolve, reject) => {
          editTemplate.mutate(
            { id: editingTemplate.id, data: payload },
            { onSuccess: () => resolve(), onError: (err) => reject(err) }
          );
        });
      }

      // Then assign staff via the assignment endpoint (if changed)
      if (staffChanged && editForm.staffId) {
        await new Promise<void>((resolve, reject) => {
          assignStaff.mutate(
            { templateId: editingTemplate.id, staffId: Number(editForm.staffId) },
            { onSuccess: () => resolve(), onError: (err) => reject(err) }
          );
        });
      }

      setEditingTemplate(null);
    } catch (err: unknown) {
      setEditError(extractError(err));
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900 py-16 text-center">
        <ClipboardList className="h-12 w-12 text-slate-500 mb-4" />
        <p className="text-sm text-slate-400">No task templates for this location.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t: any) => (
          <div
            key={t.id}
            className="relative rounded-xl border border-slate-700/60 bg-slate-900 p-5 transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-indigo-500/5"
          >
            {/* Header: title + 3-dot menu */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                {t.description && (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{t.description}</p>
                )}
              </div>

              {/* 3-dot menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {openMenu === t.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                    <div className="absolute right-0 top-8 z-50 w-36 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                      <button
                        onClick={() => handleEditOpen(t)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={t.recurringType ?? "ONCE"} />
              <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>

            {/* Assigned Staff */}
            <div className="mt-3 border-t border-slate-700/40 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Assigned To</p>
              {t.staff ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                    {t.staff.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300">{t.staff.name}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">Unassigned</span>
              )}
            </div>

            {/* Shift & Date */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Shift</p>
                <p className="text-slate-300 font-medium">{fmtTime(t.shiftStart)} – {fmtTime(t.shiftEnd)}</p>
              </div>
              <div>
                <p className="text-slate-500">Effective</p>
                <p className="text-slate-300 font-medium">
                  {t.effectiveDate ? new Date(t.effectiveDate).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Edit Dialog */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingTemplate(null)}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Edit Task Template</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assigned Staff</label>
                <select
                  value={editForm.staffId}
                  onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Unassigned</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Start / End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Shift Start</label>
                  <input
                    type="time"
                    value={editForm.shiftStart}
                    onChange={(e) => setEditForm({ ...editForm, shiftStart: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Shift End</label>
                  <input
                    type="time"
                    value={editForm.shiftEnd}
                    onChange={(e) => setEditForm({ ...editForm, shiftEnd: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Recurring Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Recurring Type</label>
                <select
                  value={editForm.recurringType}
                  onChange={(e) => setEditForm({ ...editForm, recurringType: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select type</option>
                  <option value="DAILY">Daily</option>
                  <option value="ONCE">Once</option>
                </select>
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Effective Date</label>
                <input
                  type="date"
                  value={editForm.effectiveDate}
                  onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Error Message */}
              {editError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {editError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editTemplate.isPending || !editForm.title.trim()}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
                >
                  {editTemplate.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


const LocationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [activeTab, setActiveTab] = useState<Tab>("staff");

  const currentFilter = FILTERS.find((f) => f.key === activeFilter)!;
  const filter = currentFilter.toFilter();

  const { data, isLoading, isFetching } = useGetLocationById(id!, filter);
  const locationInfo = data?.data?.locationInfo;
  const taskStats: TaskStatEntry[] = data?.data?.taskStats ?? [];

  console.log("location info is::",locationInfo);

  const staffCount = locationInfo?.staff?.length ?? 0;
  const templateCount = locationInfo?.taskTemplates?.length ?? 0;
  const instanceCount = locationInfo?.taskInstances?.length ?? 0;
  const completedCount = taskStats.find((t) => t.status === "COMPLETED")?._count?.status ?? 0;

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!locationInfo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="text-base font-semibold text-white">Location not found</p>
          <button onClick={() => navigate(-1)} className="mt-2 text-sm text-indigo-400 hover:underline">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/locations" className="text-slate-400 hover:text-white transition-colors">
          Locations
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-white font-medium">{locationInfo.name}</span>
      </div>

      {/* Location Header */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/20">
              <MapPin className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{locationInfo.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
                <Building2 className="h-3.5 w-3.5" />
                {locationInfo.address}
              </p>
            </div>
          </div>
          <StatusBadge status={locationInfo.isActive ? "ACTIVE" : "INACTIVE"} />
        </div>

        {/* Geo pills */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700/60 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400">
            <Navigation className="h-3 w-3" /> Lat: {fmtCoord(locationInfo.latitude)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400">
            <Navigation className="h-3 w-3 rotate-90" /> Lng: {fmtCoord(locationInfo.longitude)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400">
            <Radius className="h-3 w-3" /> Radius: {locationInfo.radiusMeters}m
          </span>
        </div>
      </div>

      {/* Date filter + stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900 p-1">
          <Calendar className="ml-2 h-4 w-4 text-slate-500 shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                f.key === activeFilter
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {f.key === activeFilter && isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Staff" value={staffCount} icon={Users} color="indigo" />
        <StatCard label="Task Templates" value={templateCount} icon={ClipboardList} color="purple" />
        <StatCard label="Task Instances" value={instanceCount} icon={Activity} color="cyan" />
        <StatCard label="Completed" value={completedCount} icon={CalendarCheck} color="emerald" />
      </div>

      {/* Task Status Breakdown */}
      {taskStats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {taskStats.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <StatusBadge status={entry.status} />
              <span className="text-sm font-semibold text-white">{entry._count.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700/60">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "staff" && (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Shift</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {locationInfo.staff?.length > 0 ? (
                locationInfo.staff.map((s: any) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                          {s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{s.email}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {fmtTime(s.shiftStart)} – {fmtTime(s.shiftEnd)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                    No staff assigned to this location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "templates" && <TemplatesTab templates={locationInfo.taskTemplates ?? []} staffList={locationInfo.staff ?? []} />}

      {activeTab === "instances" && (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Shift</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {locationInfo.taskInstances?.length > 0 ? (
                locationInfo.taskInstances.map((ti: any) => (
                  <tr key={ti.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-medium text-white">{ti.title}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {new Date(ti.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {fmtTime(ti.shiftStart)} – {fmtTime(ti.shiftEnd)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ti.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {ti.isLate ? (
                        <span className="font-semibold text-amber-400">+{ti.lateMinutes ?? "?"}m</span>
                      ) : (
                        <span className="text-emerald-400">On time</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No task instances for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LocationDetailPage;