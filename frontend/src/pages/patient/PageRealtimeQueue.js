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
import { Bell, Clock, User, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import Select from "../../components/ui/Select";

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

  // Derive live data
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
    <div className="max-w-7xl mx-auto animate-fade-in-up">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
              <Bell className="w-6 h-6" />
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Live Queue
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
            Real-time updates active • Auto-refreshing
          </p>
        </div>
      </div>

      {/* Doctor Selector Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

          {/* Left Side: Doctor Name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center border border-blue-100 dark:border-slate-600">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Doctor</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white truncate">
                Dr. {doctors.find(d => d._id === selectedDoctor)?.name || "Loading..."}
              </p>
            </div>
          </div>

          {/* Right Side: Dropdown & Refresh */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none w-full sm:w-64">
              <Select
                name="doctor"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                options={doctors.map(doc => ({
                  value: doc._id,
                  label: `Dr. ${doc.name} (${doc.specialization || "General"})`
                }))}
                className="w-full"
              />
            </div>

            <button
              onClick={fetchQueue}
              className="p-3 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* NOW SERVING CARD */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/20 text-center relative overflow-hidden flex-1 flex flex-col justify-center">

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {doctors.find(d => d._id === selectedDoctor)?.availabilityStatus === 'Shift Ended' ||
              doctors.find(d => d._id === selectedDoctor)?.availabilityStatus === 'Not Available' ? (
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Clock className="w-10 h-10 text-white/80" />
                </div>
                <div className="text-4xl font-black mb-2 opacity-90">OFFLINE</div>
                <p className="text-lg font-medium text-white/80">Shift has ended</p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-emerald-100 relative z-10">Now Serving</h2>
                {currentServing ? (
                  <div className="relative z-10 animate-fade-in-up">
                    <div className="text-8xl font-black drop-shadow-md mb-2">{currentServing.tokenNumber}</div>
                    <p className="text-xl font-medium text-emerald-50 truncate px-4">{currentServing.patientName}</p>
                    <div className="mt-8 inline-flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div> IN CABIN
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 opacity-80">
                    <p className="text-3xl font-bold">Not Started</p>
                    <p className="text-sm mt-2 text-emerald-100">Waiting for doctor to call next patient</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* YOUR STATUS CARD */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-6 sm:p-8 flex-1 flex flex-col justify-center relative overflow-hidden">

            {/* Decorative Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-8 text-center sm:text-left">Your Position</h2>

            {myQueueItem ? (
              myQueueItem.status === "In-Cabin" ? (
                <div className="text-center py-4">
                  <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-6 animate-bounce">
                    <AlertTriangle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">IT'S YOUR TURN!</p>
                  <p className="text-xl text-slate-500 dark:text-slate-400">Please enter the cabin immediately.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="text-center sm:text-left">
                    <div className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter">
                      #{myPosition}
                    </div>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Patients ahead of you</p>
                  </div>

                  <div className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[250px]">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">Your Token</p>
                      <p className="text-4xl font-mono font-black text-blue-600 dark:text-blue-400">{myQueueItem.tokenNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-300 font-medium">
                        Wait: <span className="font-bold text-slate-900 dark:text-white">~{myPosition * 10} mins</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">You are not in queue</p>
                <p className="text-slate-500 mt-2 mb-6">Book an appointment to join the live queue.</p>
                <button onClick={() => window.location.href = '/app/patient/book'} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                  Book Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WAITING LIST TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Waiting List</h3>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
            {waitingList.length} Patients
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto overflow-x-auto custom-scrollbar">
          {waitingList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-lg">The queue is currently empty.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                <tr>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Token</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Patient Name</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {waitingList.map((p, i) => {
                  const isMe = p.patientId?._id === user._id;
                  return (
                    <tr key={p._id} className={`group hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                      <td className="p-4 font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                        {p.tokenNumber}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-200 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px] sm:max-w-none">{p.patientName}</span>
                          {isMe && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">YOU</span>}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-right font-mono">#{i + 1}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="text-center mt-8 pb-8 text-slate-400 text-xs font-medium">
        Powered by Omisha Clinic • Live Updates
      </div>
    </div>
  );
}