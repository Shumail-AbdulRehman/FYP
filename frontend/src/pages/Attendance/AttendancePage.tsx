import { useState } from "react";
import { useGetAttendance } from "./queries";
import { useGetStaff } from "../Staff/queries";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Column } from "@/components/common/DataTable";
import { CalendarCheck, Filter } from "lucide-react";

interface AttendanceRecord {
  id: number;
  staffId: number;
  locationId: number;
  date: string;
  expectedStart: string;
  expectedEnd: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  isLateCheckIn: boolean;
  lateMinutes: number | null;
  staff: { id: number; name: string; email: string };
  location: { id: number; name: string };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AttendancePage() {
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    staffId?: number;
    from?: string;
    to?: string;
  }>({});

  const { data, isLoading } = useGetAttendance(appliedFilters);
  const staffQuery = useGetStaff();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const records: AttendanceRecord[] = data?.data ?? [];
  const allStaff = staffQuery.data?.data ?? [];

  // Summary stats
  const presentCount = records.filter(
    (r) => r.status === "CHECKED_IN" || r.status === "CHECKED_OUT"
  ).length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;

  const applyFilters = () => {
    setAppliedFilters({
      staffId: staffFilter ? Number(staffFilter) : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    });
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "staff",
      header: "Staff",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
            {r.staff.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="font-medium text-white">{r.staff.name}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (r) => (
        <span className="text-slate-400">{r.location.name}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-slate-300">{fmtDate(r.date)}</span>,
    },
    {
      key: "shift",
      header: "Expected Shift",
      render: (r) => (
        <span className="text-slate-300">
          {fmtTime(r.expectedStart)} – {fmtTime(r.expectedEnd)}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (r) => (
        <span
          className={
            r.isLateCheckIn ? "font-medium text-amber-400" : "text-emerald-400"
          }
        >
          {fmtTime(r.checkInTime)}
        </span>
      ),
    },
    {
      key: "checkOut",
      header: "Check Out",
      render: (r) => (
        <span className="text-slate-300">{fmtTime(r.checkOutTime)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "lateMin",
      header: "Late",
      render: (r) =>
        r.lateMinutes ? (
          <span className="font-medium text-amber-400">
            +{r.lateMinutes}m
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Track staff check-ins and attendance" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-700/60 bg-slate-900 p-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Staff
          </label>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Staff</option>
            {allStaff.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={applyFilters}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Filter className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm">
          <span className="text-emerald-400 font-semibold">{presentCount}</span>
          <span className="ml-1.5 text-slate-400">Present</span>
        </div>
        <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm">
          <span className="text-red-400 font-semibold">{absentCount}</span>
          <span className="ml-1.5 text-slate-400">Absent</span>
        </div>
        <div className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm">
          <span className="text-amber-400 font-semibold">{lateCount}</span>
          <span className="ml-1.5 text-slate-400">Late</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        rowKey={(r) => r.id}
        emptyIcon={<CalendarCheck className="h-12 w-12" />}
        emptyMessage="No attendance records found for the selected filters."
      />
    </div>
  );
}
