import { useState } from "react";
import { useGetAttendance } from "./queries";
import { useGetStaff } from "../Staff/queries";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Column } from "@/components/common/DataTable";
import { CalendarCheck, Filter } from "lucide-react";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAttendanceDisplayStatus } from "@/lib/attendance";

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
  "h-11 rounded-2xl border border-border/80 bg-background/90 px-4 py-2 text-sm shadow-xs outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10";

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthOptions = (count = 12) => {
  const options: { value: string; label: string }[] = [];
  const cursor = new Date();

  for (let index = 0; index < count; index += 1) {
    const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return options;
};

export default function AttendancePage() {
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    staffId?: number; from?: string; to?: string;
  }>({});
  const monthOptions = getMonthOptions();

  const { data, isLoading } = useGetAttendance(appliedFilters);
  const staffQuery = useGetStaff();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const records: AttendanceRecord[] = data?.data ?? [];
  const allStaff = staffQuery.data?.data ?? [];
  const displayStatuses = records.map((record) => getAttendanceDisplayStatus(record));

  const presentCount = displayStatuses.filter((status) => status === "CHECKED_IN" || status === "CHECKED_OUT").length;
  const absentCount = displayStatuses.filter((status) => status === "ABSENT").length;
  const lateCount = displayStatuses.filter((status) => status === "LATE").length;
  const shiftNotStartedCount = displayStatuses.filter((status) => status === "SHIFT_NOT_STARTED").length;

  const applyFilters = () => {
    setAppliedFilters({
      staffId: staffFilter ? Number(staffFilter) : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    });
  };

  const applyMonthFilter = () => {
    const [year, monthIndex] = month.split("-").map(Number);
    if (!year || !monthIndex) return;

    const startDate = new Date(year, monthIndex - 1, 1);
    const endDate = new Date(year, monthIndex, 0);

    const from = toDateInputValue(startDate);
    const to = toDateInputValue(endDate);

    setDateFrom(from);
    setDateTo(to);
    setAppliedFilters({
      staffId: staffFilter ? Number(staffFilter) : undefined,
      from,
      to,
    });
  };

  const applyQuickRange = (type: "today" | "yesterday" | "this-month") => {
    if (type === "today") {
      const today = toDateInputValue(new Date());
      setDateFrom(today);
      setDateTo(today);
      setAppliedFilters({
        staffId: staffFilter ? Number(staffFilter) : undefined,
        from: today,
        to: today,
      });
      return;
    }

    if (type === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const value = toDateInputValue(yesterday);
      setDateFrom(value);
      setDateTo(value);
      setAppliedFilters({
        staffId: staffFilter ? Number(staffFilter) : undefined,
        from: value,
        to: value,
      });
      return;
    }

    applyMonthFilter();
  };

  const clearFilters = () => {
    const currentMonth = getCurrentMonthValue();
    setMonth(currentMonth);
    setDateFrom("");
    setDateTo("");
    setStaffFilter("");
    setAppliedFilters({});
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
    { key: "status", header: "Status", render: (r) => <StatusBadge status={getAttendanceDisplayStatus(r)} /> },
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
      <PageHeader title="Attendance" subtitle="Track check-ins, check-outs, late arrivals, and absences across the team." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present" value={presentCount} icon={CalendarCheck} tone="emerald" />
        <StatCard label="Absent" value={absentCount} icon={CalendarCheck} tone="amber" />
        <StatCard label="Late" value={lateCount} icon={Filter} />
        <StatCard label="Shift Not Started" value={shiftNotStartedCount} icon={CalendarCheck} tone="slate" />
      </div>

      <FilterBar className="xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="xl:col-span-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Quick filters</label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => applyQuickRange("today")}>
              Today
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => applyQuickRange("yesterday")}>
              Yesterday
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => applyQuickRange("this-month")}>
              This Month
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Staff</label>
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className={inputCls}>
            <option value="">All Staff</option>
            {allStaff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls}>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button onClick={applyMonthFilter} variant="outline" className="h-11 w-full rounded-2xl xl:w-auto">
            Apply month
          </Button>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <div className="flex w-full gap-2 xl:w-auto">
          <Button onClick={clearFilters} variant="outline" className="h-11 w-full rounded-2xl xl:w-auto">
            Reset
          </Button>
          <Button onClick={applyFilters} className="h-11 w-full rounded-2xl xl:w-auto">
            <Filter className="h-3.5 w-3.5" /> Apply filters
          </Button>
          </div>
        </div>
      </FilterBar>

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
