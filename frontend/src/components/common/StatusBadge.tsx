const COLORS: Record<string, string> = {
  // Task statuses
  PENDING:              "bg-gray-100 text-gray-600",
  IN_PROGRESS:          "bg-amber-50 text-amber-700",
  COMPLETED:            "bg-emerald-50 text-emerald-700",
  MISSED:               "bg-red-50 text-red-700",
  NOT_COMPLETED_INTIME: "bg-orange-50 text-orange-700",
  CANCELLED:            "bg-gray-100 text-gray-500",

  // Attendance statuses
  CHECKED_OUT:          "bg-emerald-50 text-emerald-700",
  CHECKED_IN:           "bg-blue-50 text-blue-700",
  LATE:                 "bg-amber-50 text-amber-700",
  ABSENT:               "bg-red-50 text-red-700",

  // Generic
  ACTIVE:               "bg-emerald-50 text-emerald-700",
  INACTIVE:             "bg-gray-100 text-gray-500",
  DAILY:                "bg-teal-50 text-teal-700",
  ONCE:                 "bg-gray-100 text-gray-600",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const color = COLORS[status] ?? "bg-gray-100 text-gray-600";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${color} ${className}`}
    >
      {label}
    </span>
  );
}
