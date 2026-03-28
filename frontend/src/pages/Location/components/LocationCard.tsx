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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50">
            <MapPin className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">{name}</h2>
            <p className="text-sm text-gray-500">{address}</p>
          </div>
        </div>
        <StatusBadge status={status === "Active" ? "ACTIVE" : "INACTIVE"} />
      </div>

     
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="h-4 w-4 text-gray-400" />
          <span><span className="font-medium text-gray-700">{staff}</span> Staff</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <CheckSquare className="h-4 w-4 text-gray-400" />
          <span><span className="font-medium text-gray-700">{taskTemplate}</span> Task Templates</span>
        </div>
      </div>

     
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">{lat}, {lng}</span>
        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">Geofence: {geofence}</span>
      </div>

     
      <div className="mt-4 flex px-12 items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => navigate(`/locations/${id}`)}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          View Details
        </button>
       
      </div>
    </div>
  );
}
