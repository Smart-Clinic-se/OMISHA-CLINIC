import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Clock,
  Upload,
  Users,
  LogOut,
  ClipboardList,
  Settings
} from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Removed aggressive back button disabling as it conflicts with router navigation.
  // Security is handled by ProtectedRoute and strict role checks.

  const handleLogoClick = () => {
    if (!user) return;
    let targetPath = "/app";
    if (user.role === 'doctor') targetPath = "/app/doctor/dashboard";
    else if (user.role === 'staff') targetPath = "/app/staff/queue";
    else if (user.role === 'patient') targetPath = "/app/patient/queue";
    else if (user.role === 'admin') targetPath = "/app/admin/doctors";

    navigate(targetPath, { replace: true });
  };

  // === NAVIGATION CONFIGURATION ===
  const navConfig = {
    patient: [
      { name: "Book Appointment", path: "/app/patient/book", icon: <LayoutDashboard /> },
      { name: "Live Queue", path: "/app/patient/queue", icon: <Clock /> },
      { name: "Medical History", path: "/app/patient/history", icon: <FileText /> },
      { name: "Settings", path: "/app/settings", icon: <Settings /> },
    ],
    doctor: [
      { name: "Dashboard", path: "/app/doctor/dashboard", icon: <LayoutDashboard /> },
      { name: "Patient History", path: "/app/doctor/history", icon: <FileText /> },
      { name: "Settings", path: "/app/settings", icon: <Settings /> },
    ],
    staff: [
      { name: "Queue Manager", path: "/app/staff/queue", icon: <ClipboardList /> },
      { name: "Upload Reports", path: "/app/staff/upload", icon: <Upload /> },
      { name: "Daily Audit Logs", path: "/app/staff/logs", icon: <FileText /> },
      { name: "Settings", path: "/app/settings", icon: <Settings /> },
    ],
    admin: [
      { name: "Manage Team", path: "/app/admin/doctors", icon: <Users /> },
      { name: "Queue Control", path: "/app/staff/queue", icon: <ClipboardList /> },
      { name: "Audit Logs", path: "/app/staff/logs", icon: <FileText /> },
      { name: "Settings", path: "/app/settings", icon: <Settings /> },
    ],
  };

  // Safety check if user role isn't defined yet
  const links = user ? (navConfig[user.role] || []) : [];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div onClick={handleLogoClick} className="cursor-pointer group">
            <h1 className="text-xl font-black tracking-wider text-blue-400 group-hover:text-blue-300 transition-colors">OMISHA CLINIC</h1>
            <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">HMS Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
          {links.map((link, index) => {
            const isActive = location.pathname.startsWith(link.path);
            const isSettings = link.name === "Settings";
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isSettings ? "mt-8" : ""} ${isActive
                  ? "bg-blue-600 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] font-bold"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
              >
                <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"}>
                  {link.icon}
                </span>
                <span className="text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-sm font-bold"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-slate-100">
                {links.find(l => location.pathname.startsWith(l.path))?.name || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-400 font-semibold capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer" onClick={() => navigate('/app/settings')}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}