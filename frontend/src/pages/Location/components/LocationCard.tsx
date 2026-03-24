import { MoreVertical, MapPin, Users, CheckSquare, Target } from "lucide-react";

export default function LocationCard({
  title = "default",
  address = "default",
  staff = 0,
  taskTemplate = 0,
  lat = "0.000",
  lng = "0.000",
  geofence = "100m",
  status = "Active",
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-sm">
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-500">{address}</p>
          </div>
        </div>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600">
          {status}
        </span>
      </div>

      
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{staff} staff</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <span>{taskTemplate} Task Templates</span>
        </div>
      </div>

      
      <div className="mt-3 text-sm">
        <p className="text-blue-600">
          {lat}, {lng}
        </p>
        <p className="text-gray-500">Geofence: {geofence}</p>
      </div>

     
      <div className="mt-4 flex items-center gap-2 border-t pt-3">
        <button className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
          View Details
        </button>

        <button className="rounded-xl border p-2 hover:bg-gray-100">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

