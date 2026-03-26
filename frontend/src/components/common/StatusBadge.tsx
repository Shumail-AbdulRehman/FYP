const COLORS: Record<string, string> = {
  // Task statuses
  PENDING:              "bg-slate-500/20 text-slate-300",
  IN_PROGRESS:          "bg-amber-500/20 text-amber-400",
  COMPLETED:            "bg-emerald-500/20 text-emerald-400",
  MISSED:               "bg-red-500/20 text-red-400",
  NOT_COMPLETED_INTIME: "bg-orange-500/20 text-orange-400",
  CANCELLED:            "bg-slate-600/20 text-slate-400",

  // Attendance statuses
  CHECKED_OUT:          "bg-emerald-500/20 text-emerald-400",
  CHECKED_IN:           "bg-blue-500/20 text-blue-400",
  LATE:                 "bg-amber-500/20 text-amber-400",
  ABSENT:               "bg-red-500/20 text-red-400",

  // Generic
  ACTIVE:               "bg-emerald-500/20 text-emerald-400",
  INACTIVE:             "bg-slate-600/20 text-slate-400",
  DAILY:                "bg-indigo-500/20 text-indigo-400",
  ONCE:                 "bg-slate-500/20 text-slate-300",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const color = COLORS[status] ?? "bg-slate-500/20 text-slate-300";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${color} ${className}`}
    >
      {label}
    </span>
  );
}
