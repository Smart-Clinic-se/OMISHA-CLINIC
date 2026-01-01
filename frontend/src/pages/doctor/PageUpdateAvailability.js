import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import { updateDoctorAvailabilityAPI } from "../../api";
import {
  CheckCircle,
  Coffee,
  XCircle,
  Clock,
  Activity,
  Zap
} from "lucide-react";

export default function PageUpdateAvailability() {
  const { user, updateAvailability } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(user?.isAvailable ? "available" : "offline");
  const [breakMinutes, setBreakMinutes] = useState(15);

  useEffect(() => {
    if (user) {
      if (user.availabilityStatus === 'Shift Ended' || user.availabilityStatus === 'Not Available') {
        setStatus('offline');
      } else if (user.availabilityStatus === 'On Break') {
        setStatus('break');
      } else {
        setStatus('available');
      }
    }
  }, [user]);

  const handleStatusChange = async (newStatus) => {
    if (loading) return;
    setLoading(true);

    try {
      // Map simplified UI status to backend status strings
      let backendStatus = 'Available';
      if (newStatus === 'break') backendStatus = 'On Break';
      if (newStatus === 'offline') backendStatus = 'Shift Ended';

      await updateAvailability(backendStatus, newStatus === 'break' ? breakMinutes : 0);

      setStatus(newStatus);
      toast.success(`Status updated to: ${backendStatus}`);

    } catch (err) {
      console.error(err);
      toast.error("Failed to update status. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "doctor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse text-slate-400 font-bold">Loading availability controls...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in-up">

      {/* Header */}
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          Manage Availability
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium tracking-tight">Control your queue visibility and session status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Current Status Card */}
        <div className="lg:col-span-2 space-y-8">

          {/* AVAILABLE */}
          <button
            onClick={() => handleStatusChange("available")}
            disabled={loading || status === "available"}
            className={`w-full group relative p-8 rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-6 ${status === "available"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-xl shadow-emerald-500/10 scale-[1.02]"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg shadow-sm"
              }`}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${status === "available" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-emerald-500"}`}>
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold mb-1 ${status === "available" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>Available</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">I am ready to see patients. Open the queue.</p>
            </div>
            {status === "available" && (
              <span className="absolute top-6 right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg shadow-emerald-500/40">
                ACTIVE
              </span>
            )}
          </button>

          {/* ON BREAK */}
          <div className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${status === "break" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-[1.02]" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
            <div className="flex items-center gap-6 mb-6 cursor-pointer" onClick={() => handleStatusChange("break")}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${status === "break" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-amber-500"}`}>
                <Coffee className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className={`text-2xl font-bold mb-1 ${status === "break" ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>Take a Break</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Pause the queue temporarily.</p>
              </div>
            </div>

            {/* Slider */}
            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl">
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>Duration</span>
                <span className="text-amber-600 dark:text-amber-400">{breakMinutes} mins</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                disabled={loading}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>5m</span>
                <span>30m</span>
                <span>60m</span>
              </div>
            </div>
          </div>

          {/* OFFLINE */}
          <button
            onClick={() => handleStatusChange("offline")}
            disabled={loading || status === "offline"}
            className={`w-full group relative p-8 rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-6 ${status === "offline"
              ? "border-red-500 bg-red-50 dark:bg-red-500/10 shadow-xl shadow-red-500/10 scale-[1.02]"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-400 dark:hover:border-red-600 hover:shadow-lg"
              }`}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${status === "offline" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-red-500"}`}>
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold mb-1 ${status === "offline" ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>Shift Ended</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Close queue and stop accepting new patients.</p>
            </div>
          </button>

        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
              <Activity className="w-5 h-5" /> Session Status
            </h3>

            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-indigo-200 text-xs uppercase font-bold tracking-widest mb-2">Current State</p>
                <div className="text-4xl font-black tracking-tight">
                  {status === "available" && "ONLINE"}
                  {status === "break" && "ON BREAK"}
                  {status === "offline" && "OFFLINE"}
                </div>
              </div>

              <div>
                <p className="text-indigo-200 text-xs uppercase font-bold tracking-widest mb-2">System Mode</p>
                <div className="flex items-center gap-2 text-xl font-bold">
                  <Zap className="w-5 h-5 text-yellow-300" /> Real-time Queue
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Legend</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                Accepting patients
              </li>
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
                Queue paused (Break)
              </li>
              <li className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                Queue closed (Hidden)
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}