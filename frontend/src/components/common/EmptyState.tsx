import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  message = "Nothing here yet.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900 py-16 px-6 text-center">
      <div className="mb-4 text-slate-500">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <p className="text-sm text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
