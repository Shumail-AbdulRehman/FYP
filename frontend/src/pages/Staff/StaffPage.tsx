import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGetStaff, useCreateStaff, useDeactivateStaff } from "./queries";
import { useGetLocations } from "../Location/queries";
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
import { Users, Plus, Search } from "lucide-react";

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
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function StaffPage() {
  const { data, isLoading } = useGetStaff();
  const locationsQuery = useGetLocations();
  const createStaff = useCreateStaff();
  const deactivateStaff = useDeactivateStaff();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffForm>();

  if (isLoading) return <LoadingSpinner fullScreen />;

  const staff: StaffMember[] = data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Map locationId → name
  const locMap = new Map(locations.map((l: any) => [l.id, l.name]));

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Name",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
            {s.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="font-medium text-white">{s.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (s) => <span className="text-slate-400">{s.email}</span>,
    },
    {
      key: "location",
      header: "Location",
      render: (s) =>
        s.locationId ? (
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
            {locMap.get(s.locationId) ?? `#${s.locationId}`}
          </span>
        ) : (
          <span className="text-slate-500">Unassigned</span>
        ),
    },
    {
      key: "shift",
      header: "Shift",
      render: (s) => (
        <span className="text-slate-300">
          {fmtTime(s.shiftStart)} – {fmtTime(s.shiftEnd)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(`Deactivate ${s.name}? This will cancel their tasks.`)
              ) {
                deactivateStaff.mutate(s.id);
              }
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  const onCreateSubmit = (formData: CreateStaffForm) => {
    createStaff.mutate(
      {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        locationId: formData.locationId
          ? Number(formData.locationId)
          : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setDialogOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle={`${staff.length} team members`}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500">
                <Plus className="h-4 w-4" />
                Add Staff
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onCreateSubmit)}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="John Smith"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email", { required: "Email is required" })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="john@company.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Location (optional)
                  </label>
                  <select
                    {...register("locationId")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">No location</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setDialogOpen(false);
                    }}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaff.isPending}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {createStaff.isPending ? "Creating…" : "Create Staff"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name or email…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        emptyIcon={<Users className="h-12 w-12" />}
        emptyMessage="No staff members found."
      />
    </div>
  );
}
