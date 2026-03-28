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
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const inputCls =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default function AttendancePage() {
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    staffId?: number; from?: string; to?: string;
  }>({});

  const { data, isLoading } = useGetAttendance(appliedFilters);
  const staffQuery = useGetStaff();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const records: AttendanceRecord[] = data?.data ?? [];
  const allStaff = staffQuery.data?.data ?? [];

  const presentCount = records.filter((r) => r.status === "CHECKED_IN" || r.status === "CHECKED_OUT").length;
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
      key: "staff", header: "Staff",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
            {r.staff.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{r.staff.name}</span>
        </div>
      ),
    },
    { key: "location", header: "Location", render: (r) => <span className="text-gray-500">{r.location.name}</span> },
    { key: "date", header: "Date", render: (r) => <span className="text-gray-600">{fmtDate(r.date)}</span> },
    {
      key: "shift", header: "Expected Shift",
      render: (r) => <span className="text-gray-600">{fmtTime(r.expectedStart)} – {fmtTime(r.expectedEnd)}</span>,
    },
    {
      key: "checkIn", header: "Check In",
      render: (r) => (
        <span className={r.isLateCheckIn ? "font-medium text-amber-600" : "text-emerald-600"}>
          {fmtTime(r.checkInTime)}
        </span>
      ),
    },
    { key: "checkOut", header: "Check Out", render: (r) => <span className="text-gray-600">{fmtTime(r.checkOutTime)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "lateMin", header: "Late",
      render: (r) =>
        r.lateMinutes
          ? <span className="font-medium text-amber-600">+{r.lateMinutes}m</span>
          : <span className="text-gray-400">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Track staff check-ins and attendance" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Staff</label>
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className={inputCls}>
            <option value="">All Staff</option>
            {allStaff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
        </div>
        <button onClick={applyFilters} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
          <Filter className="h-3.5 w-3.5" /> Apply
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm">
          <span className="text-emerald-700 font-semibold">{presentCount}</span>
          <span className="ml-1.5 text-gray-500">Present</span>
        </div>
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm">
          <span className="text-red-700 font-semibold">{absentCount}</span>
          <span className="ml-1.5 text-gray-500">Absent</span>
        </div>
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm">
          <span className="text-amber-700 font-semibold">{lateCount}</span>
          <span className="ml-1.5 text-gray-500">Late</span>
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
