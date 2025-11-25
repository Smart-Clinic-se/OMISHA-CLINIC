import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import { updateDoctorAvailabilityAPI } from "../../api";

const StatusIcon = ({ status }) => {
  const icons = {
    available: (
      <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    break: (
      <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    offline: (
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
      </svg>
    ),
  };
  return icons[status] || icons.available;
};

export default function PageUpdateAvailability() {
  const { user, updateAvailability } = useAuth();
  const [loading, setLoading] = useState(false);
  // Default to safe values if user not fully loaded yet
  const [status, setStatus] = useState(user?.isAvailable ? "available" : "offline");
  const [breakMinutes, setBreakMinutes] = useState(15);

  useEffect(() => {
    if (user) {
        setStatus(user.isAvailable ? (user.isOnBreak ? "break" : "available") : "offline");
    }
  }, [user]);

  const handleStatusChange = async (newStatus) => {
    if (loading) return;
    setLoading(true);

    try {
      let payload = { isAvailable: true, isOnBreak: false };

      if (newStatus === "break") {
        payload.isOnBreak = true;
        payload.breakUntil = new Date(Date.now() + breakMinutes * 60 * 1000);
      } else if (newStatus === "offline") {
        payload.isAvailable = false;
      }

      // 1. Call API
      await updateDoctorAvailabilityAPI(user._id, payload);

      // 2. Update Context (UI updates immediately)
      updateAvailability(payload.isAvailable, payload.isOnBreak);

      const messages = {
        available: "You are now ONLINE — Accepting patients",
        break: `On Break for ${breakMinutes} minutes`,
        offline: "You are now OFFLINE — Queue closed",
      };

      toast.success(messages[newStatus], { duration: 4000 });
      setStatus(newStatus);

    } catch (err) {
      console.error(err);
      toast.error("Failed to update status. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  // Safety Check: Prevent crash if user is null or not a doctor
  if (!user || user.role !== "doctor") {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading availability controls...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Dr. {user.name}
          </h1>
          <p className="text-xl text-gray-600 mt-3">Manage Your Real-Time Availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Current Status Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-4">
                <StatusIcon status={status} />
                Current Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* AVAILABLE */}
                <button
                  onClick={() => handleStatusChange("available")}
                  disabled={loading || status === "available"}
                  className={`relative p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                    status === "available"
                      ? "border-emerald-500 bg-emerald-50 shadow-xl"
                      : "border-gray-200 bg-gray-50 hover:border-emerald-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🟢</div>
                    <div className="text-xl font-bold mb-1">Available</div>
                    <p className="text-gray-500 text-sm">Ready for patients</p>
                    {status === "available" && (
                      <span className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                </button>

                {/* ON BREAK */}
                <div className={`rounded-2xl ${status === "break" ? "ring-4 ring-amber-300" : ""}`}>
                  <button
                    onClick={() => handleStatusChange("break")}
                    disabled={loading || status === "break"}
                    className={`w-full p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                      status === "break"
                        ? "border-amber-500 bg-amber-50 shadow-xl"
                        : "border-gray-200 bg-gray-50 hover:border-amber-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">☕</div>
                      <div className="text-xl font-bold mb-1">On Break</div>
                      <p className="text-gray-500 text-sm">Quick pause</p>
                    </div>
                  </button>

                  {/* Slider only shows if NOT already on break (to set duration) OR if currently on break (to adjust) */}
                  <div className="mt-4 px-2">
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                        <span>5m</span>
                        <span className="text-amber-600">{breakMinutes} min</span>
                        <span>60m</span>
                      </div>
                   </div>
                </div>

                {/* OFFLINE */}
                <button
                  onClick={() => handleStatusChange("offline")}
                  disabled={loading || status === "offline"}
                  className={`relative p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                    status === "offline"
                      ? "border-red-500 bg-red-50 shadow-xl"
                      : "border-gray-200 bg-gray-50 hover:border-red-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔴</div>
                    <div className="text-xl font-bold mb-1">Offline</div>
                    <p className="text-gray-500 text-sm">End shift</p>
                    {status === "offline" && (
                      <span className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        OFF
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Session Info</h3>
              <div className="space-y-6 text-left">
                <div>
                  <p className="text-purple-200 text-sm uppercase font-bold">Current Status</p>
                  <p className="text-3xl font-black tracking-wide">
                    {status === "available" && "ONLINE"}
                    {status === "break" && "ON BREAK"}
                    {status === "offline" && "OFFLINE"}
                  </p>
                </div>
                <div>
                   <p className="text-purple-200 text-sm uppercase font-bold">System Mode</p>
                   <p className="text-xl font-medium opacity-90">Real-time Queue</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Legend</h3>
              <ul className="space-y-3 text-sm font-medium text-gray-600">
                <li className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Accepting patients</li>
                <li className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Queue paused (Break)</li>
                <li className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500"></div> Queue closed (Hidden)</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}