import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useGetStaff, useCreateStaff, useDeactivateStaff, useEditStaff } from "./queries";
import { useGetLocations } from "../Location/queries";
import { useAssignStaffToLocation } from "../Assignment/queries";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Column } from "@/components/common/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Search, Pencil, MapPin } from "lucide-react";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  locationId: number | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  isActive: boolean;
}

interface CreateStaffForm {
  name: string;
  email: string;
  password: string;
  locationId?: string;
}

const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const toTimeValue = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default function StaffPage() {
  const { data, isLoading } = useGetStaff();
  const locationsQuery = useGetLocations();
  const createStaff = useCreateStaff();
  const deactivateStaff = useDeactivateStaff();
  const editStaffMutation = useEditStaff();
  const assignLocation = useAssignStaffToLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", email: "", shiftStart: "", shiftEnd: "", locationId: "" as string,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateStaffForm>();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const staff: StaffMember[] = data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  const filtered = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = locationFilter === "all" ? true : locationFilter === "unassigned" ? s.locationId === null : s.locationId === Number(locationFilter);
    return matchesSearch && matchesLocation;
  });

  const locMap = new Map(locations.map((l: any) => [l.id, l.name]));

  const extractError = (err: any) =>
    err?.response?.data?.message || err?.response?.data?.errors?.map((e: any) => e.message).join(", ") || err?.message || "An error occurred";

  const handleEditOpen = (s: StaffMember) => {
    setEditError(null);
    setEditingStaff(s);
    setEditForm({
      name: s.name, email: s.email,
      shiftStart: toTimeValue(s.shiftStart), shiftEnd: toTimeValue(s.shiftEnd),
      locationId: s.locationId ? String(s.locationId) : "",
    });
  };

  const handleEditSave = async () => {
    if (!editingStaff) return;
    setEditError(null);
    try {
      const payload: Record<string, any> = {};
      if (editForm.name !== editingStaff.name) payload.name = editForm.name;
      if (editForm.email !== editingStaff.email) payload.email = editForm.email;
      if (editForm.shiftStart && editForm.shiftStart !== toTimeValue(editingStaff.shiftStart)) {
        const base = editingStaff.shiftStart ? new Date(editingStaff.shiftStart) : new Date();
        const [h, m] = editForm.shiftStart.split(":").map(Number);
        base.setHours(h, m, 0, 0); payload.shiftStart = base.toISOString();
      }
      if (editForm.shiftEnd && editForm.shiftEnd !== toTimeValue(editingStaff.shiftEnd)) {
        const base = editingStaff.shiftEnd ? new Date(editingStaff.shiftEnd) : new Date();
        const [h, m] = editForm.shiftEnd.split(":").map(Number);
        base.setHours(h, m, 0, 0); payload.shiftEnd = base.toISOString();
      }
      if (Object.keys(payload).length > 0) {
        await new Promise<void>((resolve, reject) => {
          editStaffMutation.mutate({ id: editingStaff.id, data: payload }, { onSuccess: () => resolve(), onError: (err) => reject(err) });
        });
      }
      const newLoc = editForm.locationId ? Number(editForm.locationId) : null;
      if (newLoc && newLoc !== editingStaff.locationId) {
        await new Promise<void>((resolve, reject) => {
          assignLocation.mutate({ staffId: editingStaff.id, locationId: newLoc }, { onSuccess: () => resolve(), onError: (err) => reject(err) });
        });
      }
      setEditingStaff(null);
    } catch (err: unknown) { setEditError(extractError(err)); }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: "name", header: "Name",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
            {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{s.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (s) => <span className="text-gray-500">{s.email}</span> },
    {
      key: "location", header: "Location",
      render: (s) => s.locationId
        ? <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">{(locMap.get(s.locationId) as string) ?? `#${s.locationId}`}</span>
        : <span className="text-gray-400">Unassigned</span>,
    },
    {
      key: "shift", header: "Shift",
      render: (s) => <span className="text-gray-600">{fmtTime(s.shiftStart)} – {fmtTime(s.shiftEnd)}</span>,
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} /> },
    {
      key: "actions", header: "Actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEditOpen(s); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm(`Deactivate ${s.name}?`)) deactivateStaff.mutate(s.id); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">Deactivate</button>
        </div>
      ),
    },
  ];

  const onCreateSubmit = (formData: CreateStaffForm) => {
    createStaff.mutate(
      { name: formData.name, email: formData.email, password: formData.password, locationId: formData.locationId ? Number(formData.locationId) : undefined },
      { onSuccess: () => { reset(); setDialogOpen(false); } }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" subtitle={`${staff.length} team members`} action={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700">
              <Plus className="h-4 w-4" /> Add Staff
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 text-gray-800">
            <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
                <input {...register("name", { required: "Name is required" })} className={inputCls} placeholder="John Smith" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" {...register("email", { required: "Email is required" })} className={inputCls} placeholder="john@company.com" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" {...register("password", { required: "Password is required" })} className={inputCls} placeholder="••••••••" />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Location (optional)</label>
                <select {...register("locationId")} className={inputCls}>
                  <option value="">No location</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { reset(); setDialogOpen(false); }} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createStaff.isPending} className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60">{createStaff.isPending ? "Creating…" : "Create Staff"}</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      } />

      {/* Search + Location Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name or email…" className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-8 text-sm text-gray-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
            <option value="all">All Locations</option>
            <option value="unassigned">Unassigned</option>
            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} emptyIcon={<Users className="h-12 w-12" />} emptyMessage="No staff members found." onRowClick={(s) => navigate(`/staff/${s.id}`)} />

      {/* Edit Staff Dialog */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingStaff(null)}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Staff</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Location</label>
                <select value={editForm.locationId} onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })} className={inputCls}>
                  <option value="">Unassigned</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Shift Start</label><input type="time" value={editForm.shiftStart} onChange={(e) => setEditForm({ ...editForm, shiftStart: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Shift End</label><input type="time" value={editForm.shiftEnd} onChange={(e) => setEditForm({ ...editForm, shiftEnd: e.target.value })} className={inputCls} /></div>
              </div>
              {editError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{editError}</div>}
              <div className="flex gap-3 pt-3">
                <button onClick={() => setEditingStaff(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">Cancel</button>
                <button onClick={handleEditSave} disabled={editStaffMutation.isPending || assignLocation.isPending || !editForm.name.trim() || !editForm.email.trim()} className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60">{editStaffMutation.isPending || assignLocation.isPending ? "Saving…" : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
