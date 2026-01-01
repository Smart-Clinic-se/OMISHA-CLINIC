import React, { useState } from "react";
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
  Settings,
  HeartPulse,
  UserCircle
} from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
      { name: "Book Appointment", path: "/app/patient/book", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Live Queue", path: "/app/patient/queue", icon: <Clock className="w-5 h-5" /> },
      { name: "Medical History", path: "/app/patient/history", icon: <FileText className="w-5 h-5" /> },
      { name: "Settings", path: "/app/settings", icon: <Settings className="w-5 h-5" /> },
    ],
    doctor: [
      { name: "Dashboard", path: "/app/doctor/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: "Patient History", path: "/app/doctor/history", icon: <FileText className="w-5 h-5" /> },
      { name: "Settings", path: "/app/settings", icon: <Settings className="w-5 h-5" /> },
    ],
    staff: [
      { name: "Queue Manager", path: "/app/staff/queue", icon: <ClipboardList className="w-5 h-5" /> },
      { name: "Upload Reports", path: "/app/staff/upload", icon: <Upload className="w-5 h-5" /> },
      { name: "Daily Audit Logs", path: "/app/staff/logs", icon: <FileText className="w-5 h-5" /> },
      { name: "Settings", path: "/app/settings", icon: <Settings className="w-5 h-5" /> },
    ],
    admin: [
      { name: "Manage Team", path: "/app/admin/doctors", icon: <Users className="w-5 h-5" /> },
      { name: "Queue Control", path: "/app/staff/queue", icon: <ClipboardList className="w-5 h-5" /> },
      { name: "Audit Logs", path: "/app/staff/logs", icon: <FileText className="w-5 h-5" /> },
      { name: "Settings", path: "/app/settings", icon: <Settings className="w-5 h-5" /> },
    ],
  };

  const links = user ? (navConfig[user.role] || []) : [];
  const currentTitle = links.find(l => location.pathname.startsWith(l.path))?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* === MOBILE SIDEBAR === */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 
          bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl 
          border-r border-slate-200 dark:border-slate-800 
          transform transition-transform duration-300 ease-in-out 
          lg:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div onClick={handleLogoClick} className="cursor-pointer flex items-center gap-3 group">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-500">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">OMISHA Clinic</h1>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="mt-4 px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const isSettings = link.name === "Settings";
            return (
              <React.Fragment key={link.path}>
                {isSettings && <div className="my-2 border-t border-slate-100 dark:border-slate-800 mx-2"></div>}

                <Link
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group
                    ${isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }
                  `}
                >
                  <div className={`flex items-center justify-center w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"}`}>
                    {link.icon}
                  </div>
                  <span className="text-sm tracking-wide">{link.name}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 rounded-lg transition-all text-sm font-bold"
          >
            <div className="w-5 h-5 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT WRAPPER === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Top Header (Navbar) */}
        <header className="
          flex-none h-16 px-4 lg:px-8
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
          border-b border-slate-200 dark:border-slate-800 
          flex items-center justify-between z-20
        ">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Logo */}
            <div onClick={handleLogoClick} className="hidden lg:flex cursor-pointer items-center gap-3 group mr-4">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">OMISHA</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinic</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {links.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                if (link.name === "Settings") return null; // Handle settings separately
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-bold text-sm
                      ${isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }
                    `}
                  >
                    {/* Clone element to adjust icon size if needed, or just render */}
                    <span className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}>
                      {React.cloneElement(link.icon, { className: "w-4 h-4" })}
                    </span>
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Settings Link (Desktop) */}
            <Link
              to="/app/settings"
              className="hidden lg:flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>

            <div
              className="relative group cursor-pointer flex items-center gap-2"
            >
              <div
                onClick={() => navigate('/app/settings')}
                className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800 group-hover:scale-105 transition-transform"
              >
                {user?.name?.charAt(0).toUpperCase() || <UserCircle className="w-5 h-5" />}
              </div>

              {/* Desktop Logout Button */}
              <button
                onClick={logout}
                className="hidden lg:flex p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}