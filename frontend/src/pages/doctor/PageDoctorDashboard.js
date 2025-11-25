import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getQueueAPI, updateQueueStatusAPI, listenToQueueUpdates } from "../../api";
import { useAuth } from "../../AuthContext"; // Importing Context Action
import toast from "react-hot-toast";
import {
  Coffee,
  Activity,
  LogOut,
  FileText,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Users,
  Moon,
  XCircle,
  ChevronDown,
  Droplet
} from "lucide-react";

export default function PageDoctorDashboard() {
  // Added updateAvailability to destructuring
  const { user, logout, updateAvailability } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [nextPatient, setNextPatient] = useState(null);

  // Availability State (Initialize from User Context)
  const [status, setStatus] = useState(user?.availabilityStatus || 'Not Available');
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);

  // --- 1. Fetch Queue ---
  const fetchQueue = useCallback(async () => {
    try {
      const res = await getQueueAPI({ doctorId: user._id });
      const data = res.data.data || [];
      setQueue(data);

      const inCabin = data.find(p => p.status === 'In-Cabin');
      const waiting = data.filter(p => p.status === 'Waiting');

      setCurrentPatient(inCabin || null);
      setNextPatient(waiting[0] || null);
    } catch (err) {
      console.error(err);
    }
  }, [user._id]);

  useEffect(() => {
    fetchQueue();
    const cleanup = listenToQueueUpdates((payload) => {
      if (payload.doctorId === user._id) fetchQueue();
    });
    return cleanup;
  }, [fetchQueue, user._id]);

  // --- 2. Status & Break Logic ---
  useEffect(() => {
    let interval;
    if (status === 'On Break' && breakTimeLeft > 0) {
      interval = setInterval(() => setBreakTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status, breakTimeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // === STATUS CHANGE HANDLER ===
  const changeStatus = async (newStatus) => {
    try {
      setStatusMenuOpen(false);
      if (newStatus !== 'On Break') setBreakTimeLeft(0);

      // Use Context Function to sync Sidebar & Backend simultaneously
      await updateAvailability(newStatus);
      setStatus(newStatus);

      toast.success(`Status set to: ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // === BREAK HANDLER ===
  const toggleBreak = async (duration) => {
    try {
      const newStatus = 'On Break';
      setStatus(newStatus);
      setBreakTimeLeft(duration * 60);

      // Update Context & Backend
      await updateAvailability(newStatus, duration);

      toast.success(`Break started: ${duration} mins`);
    } catch (err) {
      toast.error("Failed to update status");
      setStatus('Available');
    }
  };

  const resumeWork = async () => {
    changeStatus('Available');
  };

  const handlePrescribe = () => {
    if (!currentPatient) return;
    navigate('/app/doctor/prescription', {
      state: {
        queueId: currentPatient._id,
        tokenNumber: currentPatient.tokenNumber,
        patientId: currentPatient.patientId?._id || currentPatient.patientId,
        patientName: currentPatient.patientName,
        patientMobile: currentPatient.patientId?.mobile || "N/A",
        age: currentPatient.patientId?.age || currentPatient.age || 0,
        gender: currentPatient.patientId?.gender || currentPatient.gender || "Other",
        bloodGroup: currentPatient.patientId?.bloodGroup || "Unknown",
        chiefComplaint: currentPatient.chiefComplaint
      }
    });
  };

  const callNext = async () => {
    if (!nextPatient) return;
    if (currentPatient) {
      const confirmEnd = window.confirm("End current visit without prescription?");
      if (!confirmEnd) return;
      await updateQueueStatusAPI(currentPatient._id, { status: 'Completed' });
    }
    try {
      await updateQueueStatusAPI(nextPatient._id, { status: 'In-Cabin' });
      toast.success(`Called ${nextPatient.tokenNumber}`);
    } catch (err) {
      toast.error("Failed to call next patient");
    }
  };

  // Helper for Badge Colors
  const getStatusColor = () => {
    if (status === 'Available') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'On Break') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* === HEADER === */}
        <header className="relative z-30 flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">Dr. {user.name}</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">General Physician</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">

            {/* === STATUS DROPDOWN === */}
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95 ${getStatusColor()}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'Available' ? 'bg-emerald-500 animate-pulse' : status === 'On Break' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                {status}
                <ChevronDown className={`w-4 h-4 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-60 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 z-20 overflow-hidden animate-fade-in-up">
                    <div className="p-1">
                      <button onClick={() => changeStatus('Available')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-500/10 rounded-xl transition text-left group">
                        <CheckCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">Set Available</p>
                          <p className="text-[10px] text-slate-400">Accepting patients</p>
                        </div>
                      </button>
                      <button onClick={() => changeStatus('Not Available')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition text-left group">
                        <XCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">Set Not Available</p>
                          <p className="text-[10px] text-slate-400">Pause queue</p>
                        </div>
                      </button>
                      <button onClick={() => changeStatus('Shift Ended')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition text-left group border-t border-slate-800">
                        <Moon className="w-5 h-5 text-slate-500 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">Shift Ended</p>
                          <p className="text-[10px] text-slate-400">Close for the day</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-8 bg-slate-800 mx-2"></div>

            <button onClick={logout} className="p-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* BREAK OVERLAY */}
        {status === 'On Break' && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-slate-900 p-12 rounded-[2rem] shadow-2xl text-center max-w-lg w-full animate-fade-in-up border border-slate-800">
              <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-slate-800 shadow-xl">
                <Coffee className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2">On Break</h2>
              <p className="text-slate-400 mb-10 text-lg">Queue is paused. Enjoy your time off.</p>

              <div className="bg-orange-500/10 rounded-2xl p-6 mb-10 border border-orange-500/20">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Time Remaining</p>
                <div className="text-7xl font-mono font-black text-orange-500 tabular-nums tracking-tight">
                  {formatTime(breakTimeLeft)}
                </div>
              </div>

              <button onClick={resumeWork} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-lg flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6" /> Resume Consultation
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- LEFT: CURRENT PATIENT --- */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-xl shadow-black/20 border border-slate-800 overflow-hidden min-h-[500px] flex flex-col relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              <div className="p-8 flex-grow flex flex-col relative z-10">
                {currentPatient ? (
                  <div className="animate-fade-in-up h-full flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> In Consultation
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${currentPatient.visitType === 'New' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {currentPatient.visitType || "New Visit"}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                      <div className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-sm">
                        {currentPatient.tokenNumber}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl font-bold text-white mb-3">{currentPatient.patientName}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-slate-400 font-medium">
                          <span className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-sm">
                            {currentPatient.patientId?.gender || currentPatient.gender}, {currentPatient.patientId?.age || currentPatient.age} yrs
                          </span>
                          <span className="bg-red-500/10 px-3 py-1 rounded border border-red-500/20 text-red-400 text-sm flex items-center gap-1">
                            <Droplet className="w-3 h-3" /> {currentPatient.patientId?.bloodGroup || "N/A"}
                          </span>
                          <span className={`bg-slate-800 px-3 py-1 rounded border border-slate-700 flex items-center gap-2 text-sm ${currentPatient.paymentStatus === 'Paid' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                            <CreditCard className="w-3 h-3" />
                            {currentPatient.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-auto">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Visit</p>
                      <p className="text-xl text-slate-200 font-medium leading-relaxed">
                        "{currentPatient.chiefComplaint || "No specific complaint recorded."}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <button
                        onClick={() => navigate('/app/doctor/history', { state: { patientId: currentPatient.patientId?._id, patientName: currentPatient.patientName } })}
                        className="py-4 bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all"
                      >
                        <FileText className="w-5 h-5" /> View History
                      </button>
                      <button
                        onClick={handlePrescribe}
                        className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                      >
                        <CheckCircle className="w-5 h-5" /> Start Prescription
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                      <Users className="w-12 h-12 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-500">Cabin is Empty</h3>
                    <p className="text-slate-600 mt-2">Call the next patient to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: QUEUE & CONTROLS --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> Up Next
              </h3>
              {nextPatient ? (
                <div className="animate-slide-in-right">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-4xl font-black text-white">{nextPatient.tokenNumber}</div>
                      <div className="font-bold text-slate-400 truncate max-w-[150px]">{nextPatient.patientName}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${nextPatient.visitType === 'New' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {nextPatient.visitType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={callNext}
                    disabled={status !== 'Available'}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    Call Patient <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-600 italic text-sm">No patients waiting.</div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 text-center shadow-sm">
                <div className="text-3xl font-black text-white">{queue.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Queue</div>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 text-center shadow-sm">
                <div className="text-3xl font-black text-emerald-500">
                  {queue.filter(p => p.status === 'Completed').length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Completed</div>
              </div>
            </div>

            {/* Quick Break */}
            <div className="bg-orange-500/10 p-6 rounded-3xl border border-orange-500/20">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Coffee className="w-4 h-4" /> Take a Break
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[5, 15, 30, 45, 60].map(min => (
                  <button key={min} onClick={() => toggleBreak(min)} className="py-3 bg-slate-800 text-orange-400 border border-orange-500/20 rounded-xl text-sm font-bold hover:bg-orange-500/20 transition shadow-sm hover:shadow-md">
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}