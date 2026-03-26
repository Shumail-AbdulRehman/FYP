import { MoreVertical, MapPin, Users, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LocationCardProps } from "../types";
import StatusBadge from "@/components/common/StatusBadge";

export default function LocationCard({
  name = "default",
  address = "default",
  staff = 0,
  taskTemplate = 0,
  lat = "0.000",
  lng = "0.000",
  geofence = "100m",
  status = "Active",
  id,
}: LocationCardProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-5 transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/20">
            <MapPin className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{name}</h2>
            <p className="text-sm text-slate-400">{address}</p>
          </div>
        </div>
        <StatusBadge status={status === "Active" ? "ACTIVE" : "INACTIVE"} />
      </div>

      {/* Stats */}
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="h-4 w-4 text-slate-500" />
          <span>
            <span className="font-medium text-slate-300">{staff}</span> Staff
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <CheckSquare className="h-4 w-4 text-slate-500" />
          <span>
            <span className="font-medium text-slate-300">{taskTemplate}</span>{" "}
            Task Templates
          </span>
        </div>
      </div>

      {/* Geo info */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {lat}, {lng}
        </span>
        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
          Geofence: {geofence}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-700/60 pt-3">
        <button
          onClick={() => navigate(`/locations/${id}`)}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          View Details
        </button>
        <button className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
