import React, { useState, useEffect, useCallback } from "react";
import {
  getQueueAPI,
  getDoctorsAPI,
  listenToQueueUpdates,
  listenToDoctorStatus,
  checkIfMyTurnIsNear,
  requestNotificationPermission,
} from "../../api";
import { useAuth } from "../../AuthContext";

// Reusable SVG Icons (Slightly resized for responsive)
const Icons = {
  Bell: () => <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Clock: () => <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  User: () => <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Alert: () => <svg className="w-16 h-16 sm:w-20 sm:h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.384 4.5c-.768-1.333-2.664-1.333-3.432 0L3.928 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

export default function PageRealtimeQueue() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(true);

  // Request notification permission once
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load available doctors
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await getDoctorsAPI();
        setDoctors(res.data || []);
        if (res.data.length > 0) setSelectedDoctor(res.data[0]._id);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }
    };
    loadDoctors();
  }, []);

  // Fetch queue for selected doctor
  const fetchQueue = useCallback(async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      const res = await getQueueAPI({ doctorId: selectedDoctor });
      setQueue(res.data.data || []);
    } catch (err) {
      console.error("Queue fetch failed:", err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor]);

  // Derive live data with Safety Checks
  const safeQueue = Array.isArray(queue) ? queue : [];
  const currentServing = safeQueue.find(p => p.status === "In-Cabin");
  const waitingList = safeQueue.filter(p => p.status === "Waiting");

  const myQueueItem = safeQueue.find(p => p.patientId?._id === user._id && ["Waiting", "In-Cabin"].includes(p.status));
  const myPosition = myQueueItem ? waitingList.findIndex(p => p._id === myQueueItem._id) + 1 : null;

  // Real-time socket updates
  useEffect(() => {
    fetchQueue();

    const cleanupQueue = listenToQueueUpdates((payload) => {
      if (payload.doctorId !== selectedDoctor) return;
      fetchQueue();
      if (payload.calledToken && myQueueItem) {
        checkIfMyTurnIsNear(myQueueItem.tokenNumber, payload.calledToken);
      }
    });

    const cleanupDoctor = listenToDoctorStatus((payload) => {
      setDoctors(prevDoctors => prevDoctors.map(doc =>
        doc._id === payload.doctorId
          ? { ...doc, availabilityStatus: payload.status, breakUntil: payload.breakUntil }
          : doc
      ));
    });

    return () => {
      cleanupQueue();
      cleanupDoctor();
    };
  }, [selectedDoctor, fetchQueue, myQueueItem]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 sm:mb-12 text-left">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon is now separate so it stays solid blue and visible */}
            <span className="text-blue-400">
              <Icons.Bell />
            </span>
            {/* Text keeps the gradient effect */}
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Live Queue
            </h1>
          </div>
          <p className="text-lg sm:text-2xl text-slate-400 mt-2 sm:mt-4">
            Real-time updates active
          </p>
        </div>

        {/* Doctor Selector - MOBILE OPTIMIZED */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-800">

            {/* Added flex-col for mobile stacking, sm:flex-row for desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">

              {/* Left Side: Doctor Name */}
              <div className="w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Current Doctor</p>
                <p className="text-xl sm:text-2xl font-bold text-white truncate">
                  Dr. {doctors.find(d => d._id === selectedDoctor)?.name || "Loading..."}
                </p>
              </div>

              {/* Right Side: Dropdown & Button Wrapper */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  className="flex-1 sm:flex-none w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm sm:text-lg rounded-2xl shadow-lg cursor-pointer outline-none appearance-none truncate"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id} className="text-slate-900 bg-white">
                      Dr. {doc.name} ({doc.specialization || "General"})
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchQueue}
                  className="shrink-0 p-3 sm:p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:bg-slate-700 transition text-white"
                >
                  <Icons.Refresh />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 mb-8 sm:mb-12">

          {/* Now Serving Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center relative overflow-hidden border border-emerald-500/30">
              <div className="absolute inset-0 bg-black opacity-20"></div>

              {doctors.find(d => d._id === selectedDoctor)?.availabilityStatus === 'Shift Ended' ||
                doctors.find(d => d._id === selectedDoctor)?.availabilityStatus === 'Not Available' ? (
                <div className="relative z-10">
                  <div className="text-4xl sm:text-6xl font-black mb-4 opacity-50">OFFLINE</div>
                  <p className="text-lg sm:text-2xl font-bold">Shift Ended</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-4 sm:mb-6 relative z-10">Now Serving</h2>
                  {currentServing ? (
                    <>
                      {/* Responsive text sizing for token number */}
                      <div className="text-7xl sm:text-9xl font-black drop-shadow-2xl relative z-10">{currentServing.tokenNumber}</div>
                      <p className="text-xl sm:text-3xl font-light mt-2 sm:mt-4 relative z-10 truncate">{currentServing.patientName}</p>
                      <div className="mt-6 sm:mt-8 inline-block px-6 py-3 sm:px-8 sm:py-4 bg-white/20 backdrop-blur rounded-full text-lg sm:text-2xl font-bold animate-pulse relative z-10">
                        IN CABIN
                      </div>
                    </>
                  ) : (
                    <p className="text-2xl sm:text-3xl opacity-80 relative z-10">Not Started</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Your Status Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-12 border border-slate-800 h-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center sm:text-left">Your Position</h2>
              {myQueueItem ? (
                myQueueItem.status === "In-Cabin" ? (
                  <div className="text-center py-8 sm:py-16">
                    <div className="text-emerald-500 flex justify-center mb-4"><Icons.Alert /></div>
                    <p className="text-4xl sm:text-6xl font-black text-emerald-500">IT'S YOUR TURN!</p>
                    <p className="text-xl sm:text-3xl mt-4 sm:mt-6 text-slate-300">Please enter the cabin</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      #{myPosition}
                    </div>
                    <p className="text-2xl sm:text-4xl text-slate-400 mt-2 sm:mt-4">Patients ahead</p>
                    <div className="mt-6 sm:mt-10 p-6 sm:p-8 bg-slate-800/50 rounded-3xl border border-slate-700">
                      <p className="text-lg sm:text-2xl text-slate-300">Your Token: <span className="font-mono text-4xl sm:text-5xl font-black text-blue-400">{myQueueItem.tokenNumber}</span></p>
                      <p className="mt-4 sm:mt-6 text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 text-slate-400">
                        <Icons.Clock /> Wait: ~<span className="font-black text-2xl sm:text-3xl text-blue-400 ml-1">{myPosition * 8} mins</span>
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-10 sm:py-20 text-slate-600">
                  <div className="flex justify-center mb-4"><Icons.User /></div>
                  <p className="text-2xl sm:text-3xl mt-4 sm:mt-8">You are not in queue</p>
                  <p className="text-lg sm:text-xl mt-2 sm:mt-4">Book an appointment first</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Waiting List */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 sm:p-8 border-b border-slate-800">
            <h3 className="text-xl sm:text-3xl font-black flex items-center justify-between">
              Waiting <span className="bg-white/10 px-4 py-1 sm:px-6 sm:py-2 rounded-full text-lg sm:text-2xl border border-white/10">{waitingList.length}</span>
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {waitingList.length === 0 ? (
              <div className="p-12 sm:p-20 text-center text-slate-500">
                <p className="text-xl sm:text-3xl">Queue is empty</p>
              </div>
            ) : (
              <table className="w-full">
                <tbody>
                  {waitingList.map((p, i) => (
                    <tr key={p._id} className={`border-b border-slate-800 hover:bg-slate-800/50 transition-all text-base sm:text-lg ${p.patientId?._id === user._id ? 'bg-blue-900/20 font-bold' : ''}`}>
                      {/* Reduced padding for mobile table cells */}
                      <td className="p-4 sm:p-6 text-center font-mono text-xl sm:text-3xl text-blue-400">{p.tokenNumber}</td>
                      <td className="p-4 sm:p-6 text-sm sm:text-xl text-slate-200">
                        <div className="truncate max-w-[120px] sm:max-w-none">{p.patientName}</div>
                        {p.patientId?._id === user._id && <span className="text-blue-400 text-xs sm:text-sm block sm:inline sm:ml-2">← YOU</span>}
                      </td>
                      <td className="p-4 sm:p-6 text-xs sm:text-base text-slate-500 text-right sm:text-left">#{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12 text-slate-600 text-xs sm:text-sm">
          Powered by Omisha Clinic • Real-time • Secure
        </div>
      </div>
    </div>
  );
}