import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/queries/auth";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/locations", icon: MapPin, label: "Locations" },
  { to: "/staff", icon: Users, label: "Staff" },
  { to: "/attendance", icon: CalendarCheck, label: "Attendance" },
];

export default function Sidebar() {
  const user = useSelector((s: RootState) => s.auth.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-sm">
          CO
        </div>
        <span className="text-[15px] font-bold text-gray-900 tracking-tight">
          CleanOps
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-teal-50 text-teal-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 px-3 py-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">
              {user?.name ?? "Manager"}
            </p>
            <p className="truncate text-xs text-gray-400">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout.mutate(undefined, {
              onSuccess: () => navigate("/login"),
            });
          }}
          disabled={logout.isPending}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          {logout.isPending ? "Logging out…" : "Log Out"}
        </button>
      </div>
    </aside>
  );
}
