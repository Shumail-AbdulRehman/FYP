import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-[240px] flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
