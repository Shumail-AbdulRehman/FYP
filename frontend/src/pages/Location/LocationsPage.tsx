import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useCreateLocation, useGetLocations } from "./queries";
import LocationCard from "./components/LocationCard";
import type { LocationWithCounts, LocationFormValues } from "./types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { MapPin, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default function LocationsPage() {
  const createLocation = useCreateLocation();
  const getLocations = useGetLocations();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>();

  const onSubmit: SubmitHandler<LocationFormValues> = async (data) => {
    await createLocation.mutateAsync(
      { name: data.name, address: data.address, latitude: data.latitude, longitude: data.longitude },
      { onSuccess: () => { reset(); setDialogOpen(false); } }
    );
  };

  if (createLocation.isPending || getLocations.isPending) return <LoadingSpinner fullScreen />;

  const locations = getLocations.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Locations" subtitle={`${locations.length} locations`} action={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700">
              <Plus className="h-4 w-4" /> Add Location
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 text-gray-800">
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Location Name</label>
                <input {...register("name", { required: "Name is required" })} className={inputCls} placeholder="Downtown Office Tower" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
                <input {...register("address", { required: "Address is required" })} className={inputCls} placeholder="123 Main St, Metropolis" />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Latitude</label>
                  <input type="number" step="any" {...register("latitude", { required: "Latitude is required" })} className={inputCls} placeholder="33.6844" />
                  {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Longitude</label>
                  <input type="number" step="any" {...register("longitude", { required: "Longitude is required" })} className={inputCls} placeholder="73.0479" />
                  {errors.longitude && <p className="mt-1 text-xs text-red-500">{errors.longitude.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { reset(); setDialogOpen(false); }} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createLocation.isPending} className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60">{createLocation.isPending ? "Creating…" : "Create Location"}</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      } />

      {locations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc: LocationWithCounts) => (
            <LocationCard key={loc.id} name={loc.name} address={loc.address} staff={loc._count.staff} taskTemplate={loc._count.taskTemplates} lat={loc.latitude.toString()} lng={loc.longitude.toString()} id={loc.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          message="No locations yet. Add your first location to get started."
          action={<button onClick={() => setDialogOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">Add Location</button>}
        />
      )}
    </div>
  );
}