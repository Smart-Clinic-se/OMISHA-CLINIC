import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getQueueAPI, updateQueueStatusAPI, listenToQueueUpdates, notifyStaffAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import {
  Coffee,
  Activity,
  LogOut,
  FileText,
  ChevronRight,
  CheckCircle,
  Moon,
  XCircle,
  ChevronDown,
  User,
  Calendar,
  Droplet,
  Clock,
  Play,
  Shield,
  CreditCard,
  AlertTriangle,
  Bell
} from "lucide-react";

const getPassStatus = (pass) => {
  if (!pass) return null;
  const now = new Date();
  const end = new Date(pass.validTo);
  const diff = end - now;
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    valid: diff > 0,
    hoursLeft,
    daysLeft,
    label: diff > 0 ? (daysLeft > 0 ? `${daysLeft}d left` : `${hoursLeft}h left`) : "Expired"
  };
};

export default function PageDoctorDashboard() {
  const { user, logout, updateAvailability } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [nextPatient, setNextPatient] = useState(null);

  // Availability State
  const [status, setStatus] = useState(user?.availabilityStatus || 'Not Available');
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showPayInfo, setShowPayInfo] = useState(false);

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

  const changeStatus = async (newStatus) => {
    try {
      setStatusMenuOpen(false);
      if (newStatus !== 'On Break') setBreakTimeLeft(0);
      await updateAvailability(newStatus);
      setStatus(newStatus);
      toast.success(`Status set to: ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const toggleBreak = async (duration) => {
    try {
      const newStatus = 'On Break';
      setStatus(newStatus);
      setBreakTimeLeft(duration * 60);
      await updateAvailability(newStatus, duration);
      toast.success(`Break started: ${duration} mins`);
    } catch (err) {
      toast.error("Failed to update status");
      setStatus('Available');
    }
  };

  const resumeWork = async () => changeStatus('Available');

  const handlePrescribe = () => {
    if (!currentPatient) return;
    navigate('/app/doctor/prescription', {
      state: {
        queueId: currentPatient._id,
        tokenNumber: currentPatient.tokenNumber,
        patientId: currentPatient.patientId?._id || currentPatient.patientId,
        patientName: currentPatient.patientName,
        patientMobile: currentPatient.patientId?.mobile || "N/A",
        age: (currentPatient.patientId?.age && currentPatient.patientId?.age !== 'N/A') ? currentPatient.patientId.age : (currentPatient.age || 'N/A'),
        gender: currentPatient.patientId?.gender || currentPatient.gender || "Other",
        bloodGroup: currentPatient.patientId?.bloodGroup || "Unknown",
        chiefComplaint: currentPatient.chiefComplaint
      }
    });
  };

  const notifyStaff = async (message) => {
    try {
      await notifyStaffAPI({
        queueId: nextPatient ? nextPatient._id : null,
        doctorId: user._id,
        message: message || "Doctor Requesting Assistance"
      });
      toast.success("Staff Notified!");
    } catch (err) {
      toast.error("Failed to notify staff");
      console.error(err);
    }
  };

  const callNext = async () => {
    if (!nextPatient) return;

    // === UNPAID BLOCKER ===
    if (nextPatient.paymentStatus === 'Unpaid') {
      toast.error("Cannot call Unpaid Patient!");
      return;
    }

    // === VITALS BLOCKER ===
    // Allow if:
    // 1. Vitals are Confirmed for this visit (vitalsConfirmed === true)
    // 2. OR Patient has recent vitals from TODAY (lastVitalsDate === today)
    const hasVitalsConfirmed = nextPatient.vitalsConfirmed;
    let hasRecentVitals = false;

    // Check Date Recency from Patient Object
    if (nextPatient.patientId?.lastVitalsDate) {
      const lastDate = new Date(nextPatient.patientId.lastVitalsDate);
      const today = new Date();
      // Check if Same Day
      hasRecentVitals = lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear();
    }

    if (!hasVitalsConfirmed && !hasRecentVitals) {
      toast.error("Vitals Missing! Please ask staff to update.");
      return;
    }

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

  const getStatusColor = () => {
    if (status === 'Available') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    if (status === 'On Break') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">

      {/* === HEADER === */}
      <header className="relative z-30 flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-slate-800/80 backdrop-blur-xl p-3 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Dr. {user.name}</h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">General Physician</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <button
            onClick={() => notifyStaff("General Assistance Request")}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600"
            title="Call Staff"
          >
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all active:scale-95 ${getStatusColor()}`}
            >
              <div className={`w-2 h-2 rounded-full ${status === 'Available' ? 'bg-emerald-500 animate-pulse' : status === 'On Break' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
              {status}
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStatusMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden animate-fade-in-up">
                  <div className="p-1 space-y-0.5">
                    <button onClick={() => changeStatus('Available')} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition text-left group">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Available</span>
                    </button>
                    <button onClick={() => changeStatus('Not Available')} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition text-left group">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Not Available</span>
                    </button>
                    <button onClick={() => changeStatus('Shift Ended')} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left group">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Shift Ended</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* BREAK OVERLAY */}
      {status === 'On Break' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* ... Break UI (unchanged logic) ... */}
          <div className="text-white text-center">
            <h1 className="text-3xl font-black">On Break</h1>
            <p className="mt-4 text-xl font-mono">{formatTime(breakTimeLeft)}</p>
            <button onClick={resumeWork} className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-xl">Resume Work</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* --- LEFT: QUEUE & NEXT (4 COLS) --- */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 p-4 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" /> Up Next
            </h3>
            {nextPatient ? (
              <div className="animate-slide-in-right">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{nextPatient.tokenNumber}</div>
                    <div className="font-bold text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] mt-0.5">{nextPatient.patientName}</div>
                  </div>
                </div>

                {/* PAYMENT BLOCKER */}
                {nextPatient.paymentStatus === 'Unpaid' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100">
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Payment Pending. Cannot Call.</span>
                    </div>
                    <button disabled className="w-full py-2.5 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                      Call Blocked
                    </button>
                  </div>
                ) : (
                  // VITALS BLOCKER UI
                  (!nextPatient.vitalsConfirmed && !(nextPatient.patientId?.lastVitalsDate && new Date(nextPatient.patientId.lastVitalsDate).toDateString() === new Date().toDateString())) ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-50 text-amber-600 text-xs font-bold rounded-xl flex items-center gap-2 border border-amber-100">
                        <Activity className="w-5 h-5 flex-shrink-0" />
                        <span>Vitals Missing/Outdated.</span>
                      </div>
                      <button disabled className="w-full py-2.5 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                        Call Blocked (Vitals)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={callNext}
                      disabled={status !== 'Available'}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                    >
                      Call Patient <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="py-5 text-center text-slate-400 italic text-xs border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                No patients waiting.
              </div>
            )}
          </div>

          {/* Quick Break (Reused) */}
          <div className="bg-amber-50 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/10">
            <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Coffee className="w-3 h-3" /> Take a Break</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[5, 15, 30, 45, 60].map(min => (
                <button key={min} onClick={() => toggleBreak(min)} className="py-1.5 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-50 transition">{min}m</button>
              ))}
            </div>
          </div>
        </div>

        {/* --- RIGHT: CURRENT PATIENT (8 COLS) --- */}
        <div className="lg:col-span-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 p-5 h-full relative overflow-hidden flex flex-col transition-all">

            {currentPatient ? (
              <div className="flex-1 flex flex-col animate-fade-in-up relative z-10">

                {/* PAYMENT STATUS BANNER */}
                <div className="mb-4">
                  {currentPatient.paymentStatus === 'Paid' ? (
                    currentPatient.consultationPassId ? (
                      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 p-3 rounded-2xl flex justify-between items-center text-sky-700 dark:text-sky-300 shadow-sm">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <Shield className="w-4 h-4" /> Covered by Pass
                        </span>
                        <span className="text-[10px] uppercase font-black bg-white dark:bg-sky-900/50 px-2 py-1 rounded-lg border border-sky-100 dark:border-sky-700/50">
                          {getPassStatus(currentPatient.consultationPassId)?.label}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded-2xl flex justify-between items-center text-emerald-700 dark:text-emerald-300 shadow-sm">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <CheckCircle className="w-4 h-4" /> Paid Visit
                        </span>
                        <span className="text-[10px] uppercase font-black bg-white dark:bg-emerald-900/50 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-700/50">
                          One-time
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-3 rounded-2xl flex justify-between items-center text-rose-700 dark:text-rose-300 shadow-sm animate-pulse-slow">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <AlertTriangle className="w-4 h-4" /> Unpaid / Override
                      </span>
                    </div>
                  )}
                </div>

                {/* Patient Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="min-w-14 h-14 px-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-xl font-black text-blue-600 dark:text-blue-500 border-4 border-white dark:border-slate-700 shadow-lg">
                      {currentPatient.tokenNumber}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{currentPatient.patientName}</h2>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-600">
                          <User className="w-2.5 h-2.5" /> {currentPatient.age || 'N/A'} yrs, {currentPatient.gender || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-5 flex-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Chief Complaint
                  </h3>
                  <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">
                    "{currentPatient.chiefComplaint}"
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handlePrescribe}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-base shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <FileText className="w-4 h-4" /> Start Consultation
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Cabin Empty</h2>
                <p className="text-slate-500 text-sm font-medium">Call the next patient to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}