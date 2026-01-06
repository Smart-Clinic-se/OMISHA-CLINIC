import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    getDoctorsAPI,
    getQueueAPI,
    updateQueueStatusAPI,
    addToQueueAPI,
    registerPatientQueueAPI,
    listenToQueueUpdates,
    listenToStaffNotifications,
    listenToDoctorStatus,
    collectPaymentAPI,
    overridePaymentAPI,
    confirmVitalsAPI,
    default as api
} from "../../api";
import toast from "react-hot-toast";
import {
    Users,
    Clock,
    CheckCircle,
    Play,
    XCircle,
    RotateCcw,
    Minus,
    Plus,

    CreditCard,
    AlertTriangle,
    FileText,
    UserPlus,
    Filter,
    Shield,
    Activity,
    Loader2,
    Search,
    UserCheck,
    Stethoscope,
    ChevronRight,
    Sparkles,
    Bell
} from "lucide-react";
import Select from "../../components/ui/Select";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";
import { useAuth } from "../../AuthContext";
import { createPortal } from "react-dom";

// Helper for date formatting
const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
};

const getRemainingTime = (validTo) => {
    if (!validTo) return "";
    const now = new Date();
    const end = new Date(validTo);
    const diff = end - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
};

export default function PageQueueManagement() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ waiting: 0, completed: 0, avgWait: 0 });

    const formRef = useEnterNavigation();

    // Modals State
    const [showWalkIn, setShowWalkIn] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPassDetails, setShowPassDetails] = useState(false);
    const [showVitalsModal, setShowVitalsModal] = useState(false);

    // Selection for Modals
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Vitals State
    const [vitalsForm, setVitalsForm] = useState({ height: "", weight: "" });
    const [reuseVitals, setReuseVitals] = useState(null);

    // Registration Form
    const [regForm, setRegForm] = useState({
        firstName: "", lastName: "", mobile: "",
        dob: "", gender: "Male",
        bloodGroup: "Unknown", address: "",
        occupation: "", recordVisibility: "Public",
        chiefComplaint: ""
    });

    // Payment Form
    const [paymentForm, setPaymentForm] = useState({
        method: "Cash",
        paymentReference: "",
        staffNote: "",
        overrideReason: ""
    });

    const [isOverrideMode, setIsOverrideMode] = useState(false);

    // Doctor Selection Modal for Search Results
    const [showDoctorSelectModal, setShowDoctorSelectModal] = useState(false);
    const [pendingPatient, setPendingPatient] = useState(null);

    // 1. Load Doctors & Listen for Status Updates
    useEffect(() => {
        const loadDoctors = async () => {
            try {
                const res = await getDoctorsAPI();
                setDoctors(res.data || []);
                if (res.data.length > 0) {
                    setSelectedDoctor(res.data[0]._id);
                }
            } catch (err) {
                toast.error("Failed to load doctors");
            }
        };
        loadDoctors();

        // Listen for Real-time Availability Updates
        const cleanup = listenToDoctorStatus((payload) => {
            console.log("Real-time Doctor Update Received:", payload);
            setDoctors(prevDoctors => prevDoctors.map(doc => {
                if (String(doc._id) === String(payload.doctorId)) {
                    console.log(`Updating Doctor ${doc.name} to ${payload.status}`);
                    return { ...doc, availabilityStatus: payload.status, breakUntil: payload.breakUntil };
                }
                return doc;
            }));
        });

        return cleanup;
    }, []);

    // 2. Fetch Queue
    const fetchQueue = useCallback(async () => {
        if (!selectedDoctor) return;
        setLoading(true);
        try {
            const res = await getQueueAPI({ doctorId: selectedDoctor });
            const data = res.data.data || [];
            setQueue(data);

            // Calculate Stats
            const waiting = data.filter(p => p.status === 'Waiting').length;
            const completed = data.filter(p => p.status === 'Completed').length;
            setStats({ waiting, completed, avgWait: waiting * 10 });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedDoctor]);

    // Listen for Doctor Notifications
    useEffect(() => {
        const cleanup = listenToStaffNotifications((payload) => {
            toast((t) => (
                <div className="flex items-center gap-4" onClick={() => toast.dismiss(t.id)}>
                    <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-full animate-bounce">
                        <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Doctor Request</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{payload.message}</p>
                    </div>
                </div>
            ), {
                duration: 6000,
                position: 'top-right',
                className: "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl",
                style: { minWidth: '350px' }
            });
        });
        return cleanup;
    }, []);

    useEffect(() => {
        fetchQueue();
        const cleanup = listenToQueueUpdates((payload) => {
            if (payload.doctorId === selectedDoctor) fetchQueue();
        });
        return cleanup;
    }, [selectedDoctor, fetchQueue]);

    // 3. Queue Actions
    const handleStatusUpdate = async (id, status) => {
        try {
            await updateQueueStatusAPI(id, { status });
            toast.success(`Marked as ${status}`);
            fetchQueue();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    // 4. Payment Collection
    const openPaymentModal = (patient) => {
        setSelectedPatient(patient);
        setPaymentForm({ method: "Cash", paymentReference: "", staffNote: "", overrideReason: "" });
        setIsOverrideMode(false);
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            if (isOverrideMode) {
                await overridePaymentAPI({
                    queueId: selectedPatient._id,
                    reasonNote: paymentForm.overrideReason,
                    performedBy: user?._id
                });
                toast.success("Payment Overridden (No Pass Created)");
            } else {
                const res = await collectPaymentAPI({
                    queueId: selectedPatient._id,
                    method: paymentForm.method,
                    paymentReference: paymentForm.paymentReference,
                    staffNote: paymentForm.staffNote,
                    collectedBy: user?._id
                });
                toast.success(`Payment Collected! Pass Valid until ${formatDate(res.data.validTo)}`, { duration: 5000 });
            }
            setShowPaymentModal(false);
            fetchQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || "Payment Failed");
        }
    };

    const openPassDetails = (patient) => {
        setSelectedPatient(patient);
        setShowPassDetails(true);
    };

    // 5. Vitals Logic
    const openVitalsModal = (patient) => {
        setSelectedPatient(patient);
        setReuseVitals(null);

        let initialFeet = "";
        let initialInches = "";

        // Check Previous Vitals
        const p = patient.patientId;
        if (p && p.lastVitalsDate) {
            const lastDate = new Date(p.lastVitalsDate);
            const diffTime = Math.abs(new Date() - lastDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Check if from TODAY
            const isToday = new Date().toDateString() === lastDate.toDateString();

            // Convert stored CM to Feet/Inches for display
            let displayHeight = p.lastHeight;
            let displayFeet = "";
            let displayInches = "";

            if (p.lastHeight) {
                const totalInches = p.lastHeight / 2.54;
                displayFeet = Math.floor(totalInches / 12);
                displayInches = Math.round(totalInches % 12);
                displayHeight = `${displayFeet}' ${displayInches}"`; // Format for display text
            }

            setReuseVitals({
                height: displayHeight, // Formatted string for display
                rawHeight: p.lastHeight, // CM for potential logic
                feet: displayFeet,
                inches: displayInches,
                weight: p.lastWeight,
                date: p.lastVitalsDate,
                daysAgo: diffDays,
                isToday
            });
        }

        // Default to empty or reuse values? Better to start empty to force check, but user asked to SEE values.
        setVitalsForm({ feet: "", inches: "", weight: "" });
        setShowVitalsModal(true);
    };

    const handleReuseVitals = () => {
        if (!reuseVitals) return;
        setVitalsForm({
            feet: reuseVitals.feet,
            inches: reuseVitals.inches,
            weight: reuseVitals.weight
        });
    };

    const handleVitalsSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert Feet/Inches to CM for Backend
            const heightCm = (Number(vitalsForm.feet) * 30.48) + (Number(vitalsForm.inches) * 2.54);

            await confirmVitalsAPI(selectedPatient._id, {
                height: Math.round(heightCm), // Send as CM
                weight: vitalsForm.weight
            });
            setShowVitalsModal(false);
            fetchQueue();
            toast.success("Vitals Updated Successfully");
        } catch (err) {
            toast.error("Failed to update vitals");
        }
    };

    // ... (Inside Return)

    // 6. Search Logic (Debounced Live Search)
    const performSearch = async (query) => {
        if (!query) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const res = await api.get('/auth/users', {
                params: { role: 'patient', search: query }
            });
            const data = res.data;
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(searchQuery);
            }, 500); // 500ms debounce
        } else {
            setSearchResults(null);
        }
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    // Manual search override (keep button functional)
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSearch(searchQuery);
    };

    // Function to Open Doctor Selection Modal
    const openDoctorSelection = (patient) => {
        setPendingPatient(patient);
        setShowDoctorSelectModal(true);
    };

    // Actual Add to Queue Function (After Doctor Selected)
    const confirmAddToQueue = async (doctorId) => {
        if (!pendingPatient || !doctorId) return;

        try {
            await addToQueueAPI({
                patientId: pendingPatient._id,
                patientName: pendingPatient.name,
                patientMobile: pendingPatient.mobile,
                age: pendingPatient.age,
                gender: pendingPatient.gender,
                visitType: "Follow-up",
                bookingSource: "Walk-in",
                assignedTo: doctorId,
                chiefComplaint: "Walk-in Visit"
            });
            toast.success("Patient Added to Queue!");
            setSearchResults(null);
            setSearchQuery("");
            setShowSearchModal(false);
            setShowDoctorSelectModal(false); // Close Doctor Modal
            setPendingPatient(null);
            fetchQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add");
        }
    };

    // 7. Registration Logic
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerPatientQueueAPI({
                ...regForm,
                assignedTo: selectedDoctor
            });
            toast.success("New Patient Registered & Queued!");
            setRegForm({
                firstName: "", lastName: "", mobile: "",
                dob: "", gender: "Male",
                bloodGroup: "Unknown", address: "",
                occupation: "", recordVisibility: "Public",
                chiefComplaint: ""
            });
            setShowWalkIn(false);
            fetchQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration Failed");
        }
    };

    return (
        <div ref={formRef} className="pb-20">
            {/* === HEADER (SCROLLABLE) === */}
            <header className="px-3 md:px-4 mb-2 pt-4">
                <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 md:p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:items-start items-center text-center md:text-left">
                        <h1 className="text-lg md:text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2 tracking-tight">
                            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                                <Users className="w-5 h-5" />
                            </div>
                            OPD Triage
                        </h1>
                        <p className="text-[10px] mobile:text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 md:ml-12 uppercase tracking-wider flex items-center gap-2 justify-center md:justify-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Queue
                        </p>
                    </div>

                    <div className="flex justify-center md:justify-end items-center gap-3 md:gap-4 w-full md:w-auto">
                        {/* Stats Pill */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="hidden md:inline text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Waiting</span>
                                <span className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">{stats.waiting}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span className="hidden md:inline text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Done</span>
                                <span className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.completed}</span>
                            </div>
                        </div>

                        {/* Doctor Selector */}
                        <div className="flex flex-col items-center md:items-end">
                            <Select
                                value={selectedDoctor}
                                onChange={e => setSelectedDoctor(e.target.value)}
                                options={doctors.map(d => ({
                                    value: d._id,
                                    label: `Dr. ${d.name} (${d.specialization || 'Gen'})`
                                }))}
                                className="w-48 md:w-56 !bg-white/50 dark:!bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:ring-indigo-500 shadow-sm text-sm"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* === MAIN CONTENT (Row) === */}
            <div className="p-3 md:p-4">
                <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

                    {/* 1. HERO ACTIONS (COMPACT BUTTONS) */}
                    <div className="flex gap-4">
                        {/* SEARCH BTN */}
                        <button
                            onClick={() => {
                                setShowSearchModal(true);
                                setSearchQuery("");
                                setSearchResults(null);
                            }}
                            className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            <Search className="w-5 h-5" strokeWidth={2.5} />
                            Search Patient
                        </button>

                        {/* REGISTER BTN */}
                        <button
                            onClick={() => setShowWalkIn(true)}
                            className="flex-1 h-14 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                            New Registration
                        </button>
                    </div>

                    {/* 2. QUEUE LIST (COMPACTED) */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] shadow-lg border border-white/50 dark:border-slate-800 overflow-hidden ring-1 ring-slate-900/5">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-900 dark:bg-white rounded-md text-white dark:text-slate-900 hidden md:flex items-center justify-center shadow-sm">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white">
                                        Current Queue
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Live Tracking • {queue.length} Patients</p>
                                </div>
                            </div>
                            <button onClick={fetchQueue} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-400 hover:text-indigo-600 hover:shadow-md group">
                                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 min-h-[300px]">
                            {queue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <Filter className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-bold text-sm">No patients in queue today</p>
                                    <p className="text-xs opacity-60">Add patients using the buttons above</p>
                                </div>
                            ) : (
                                queue.map((q, idx) => (
                                    <div key={q._id} className="p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 group">
                                        <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                                            <div className="relative flex-shrink-0">
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex flex-col items-center justify-center font-black text-lg md:text-xl shadow-md border-2 ${q.status === 'In-Cabin' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/40' :
                                                    q.status === 'Completed' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/40' :
                                                        'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                                    }`}>
                                                    <span className="text-[8px] uppercase font-bold opacity-60 leading-none mb-0.5 tracking-wider">Token</span>
                                                    {q.tokenNumber.split('-')[1]}
                                                </div>
                                                {/* Status Dot */}
                                                <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${q.status === 'In-Cabin' ? 'bg-indigo-400 animate-pulse' :
                                                    q.status === 'Completed' ? 'bg-emerald-400' :
                                                        'bg-slate-300'
                                                    }`}></div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg flex items-center gap-2 truncate">
                                                    {q.patientId?.name || "Unknown"}
                                                    {q.status === 'In-Cabin' && <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded-md flex-shrink-0">In Cabin</span>}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {q.patientId?.gender?.[0] || 'U'}, {q.patientId?.age}y</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
                                                    <span className="hidden md:inline">{q.patientId?.mobile}</span>
                                                    {getRemainingTime(q.consultationPassId?.validTo) && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md shadow-sm border border-amber-200 flex items-center gap-1 normal-case whitespace-nowrap text-[10px]">
                                                            <Sparkles className="w-3 h-3" /> Pass Active
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                                            {/* Action Buttons */}
                                            {q.status === 'Waiting' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(q._id, 'In-Cabin')}
                                                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-1.5 group/btn border border-transparent w-full sm:w-auto"
                                                        title="Call In"
                                                    >
                                                        <Play className="w-3.5 h-3.5 fill-current group-hover/btn:scale-110 transition-transform" /> Call
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(q._id, 'Absent')}
                                                        className="px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-red-600 hover:text-white hover:border-red-600 border border-slate-200 dark:border-slate-700 rounded-lg transition-all flex items-center justify-center gap-1.5 font-bold text-xs w-full sm:w-auto"
                                                        title="Mark Absent"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Absent
                                                    </button>
                                                </>
                                            )}

                                            {q.status === 'In-Cabin' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(q._id, 'Completed')}
                                                    className="col-span-2 sm:col-span-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap w-full sm:w-auto"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Finish
                                                </button>
                                            )}

                                            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0"></div>

                                            {/* Pass/Pay */}
                                            {(!q.consultationPassId || new Date(q.consultationPassId.validTo) < new Date()) ? (
                                                <button
                                                    onClick={() => openPaymentModal(q)}
                                                    className="px-3 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border border-transparent w-full sm:w-auto"
                                                >
                                                    <CreditCard className="w-3 h-3" /> Fee
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openPassDetails(q)}
                                                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 font-bold text-xs rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm w-full sm:w-auto"
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Paid
                                                </button>
                                            )}

                                            {/* Vitals */}
                                            <button
                                                onClick={() => openVitalsModal(q)}
                                                className={`px-3 py-2 rounded-lg transition-all border flex items-center justify-center gap-1.5 font-bold text-xs flex-shrink-0 w-full sm:w-auto ${q.vitalsConfirmed ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border-slate-200 hover:border-blue-200'}`}
                                                title="Check Vitals"
                                            >
                                                <Activity className={`w-3.5 h-3.5 ${q.vitalsConfirmed ? 'fill-emerald-500/20' : ''}`} /> {q.vitalsConfirmed ? 'Vitals OK' : 'Vitals'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* === MODALS (Premium Styling) === */}

            {/* 1. SEARCH MODAL */}
            {
                showSearchModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[80vh] rounded-[2rem] shadow-2xl shadow-blue-900/20 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transform scale-100 transition-all">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-white to-white dark:from-slate-800 dark:to-slate-900 flex justify-between items-center">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Search className="w-5 h-5 text-blue-600" strokeWidth={3} /> Search Patient
                                </h2>
                                <button onClick={() => setShowSearchModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><XCircle className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 flex-1">
                                <form onSubmit={handleSearchSubmit} className="relative mb-6">
                                    <input
                                        autoFocus
                                        className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl text-lg font-bold outline-none shadow-xl shadow-blue-100/50 dark:shadow-none transition-all placeholder:font-medium placeholder:text-slate-300 dark:text-white"
                                        placeholder="Start typing to search..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{ fontSize: '16px' }} // Prevent iOS zoom
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-blue-50 dark:bg-slate-700 rounded-lg">
                                        {searching ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Filter className="w-4 h-4 text-blue-400" />}
                                    </div>
                                </form>

                                <div className="overflow-y-auto max-h-[40vh] custom-scrollbar -mx-2 px-2 space-y-2">
                                    {!searchResults && <div className="text-center py-8 text-slate-400 flex flex-col items-center"><Search className="w-10 h-10 opacity-10 mb-2" />Type to find patients automatically</div>}
                                    {searchResults?.length === 0 && <div className="text-center py-8 text-slate-400">No patients found.</div>}

                                    {searchResults?.map(p => (
                                        <div key={p._id} className="p-3 bg-white dark:bg-slate-800 border-2 border-transparent hover:border-blue-500 rounded-xl transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10 flex justify-between items-center group cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center font-black text-slate-500 text-lg shadow-inner">
                                                    {p.name?.[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{p.age} Years • {p.gender} • {p.mobile}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openDoctorSelection(p)}
                                                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:scale-[1.02] shadow-lg active:scale-95 transition-all flex items-center gap-1.5 text-xs"
                                            >
                                                <Plus className="w-4 h-4" /> Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 2. REGISTRATION MODAL (FIXED PORTAL + UPDATED VALIDATION & COLORS) */}
            {
                showWalkIn && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2rem] shadow-2xl shadow-indigo-900/20 border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden transition-all">

                            {/* --- HEADER (FIXED) --- */}
                            <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                        <UserPlus className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                                            New Registration
                                        </h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Create Profile & Assign Token</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowWalkIn(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                                    <XCircle className="w-6 h-6 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                </button>
                            </div>

                            {/* --- BODY (SCROLLABLE) --- */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-6">
                                <form id="reg-form" onSubmit={handleRegisterSubmit} className="space-y-4 pb-32">
                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-xs">1</div>
                                                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Personal Details</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">First Name *</label>
                                                    <input required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} placeholder="John" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Last Name *</label>
                                                    <input required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} placeholder="Doe" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number *</label>
                                                <input required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-mono text-sm" value={regForm.mobile} onChange={e => setRegForm({ ...regForm, mobile: e.target.value })} placeholder="9876543210" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth *</label>
                                                    <input required type="date" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" value={regForm.dob} onChange={e => setRegForm({ ...regForm, dob: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gender *</label>
                                                    <Select required value={regForm.gender} onChange={e => setRegForm({ ...regForm, gender: e.target.value })} options={["Male", "Female", "Other"]} size="sm" className="text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-xs">2</div>
                                                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Medical & Contact</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Group *</label>
                                                    <Select required value={regForm.bloodGroup} onChange={e => setRegForm({ ...regForm, bloodGroup: e.target.value })} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"]} size="sm" className="text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Occupation (Optional)</label>
                                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" value={regForm.occupation} onChange={e => setRegForm({ ...regForm, occupation: e.target.value })} placeholder="e.g. Engineer" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Address (Optional)</label>
                                                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-h-[60px] text-sm" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} placeholder="Full Address" rows="2"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-slate-200 dark:border-slate-700 border-dashed" />

                                    <div className="flex items-end gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="flex-[2] space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><Activity className="w-3 h-3 text-indigo-500" /> Presenting Complaint *</label>
                                            <input required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" value={regForm.chiefComplaint} onChange={e => setRegForm({ ...regForm, chiefComplaint: e.target.value })} placeholder="e.g. High Fever, Severe Headache" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                                        {/* The Dropdown will now float over the padding bottom */}
                                        <Select required value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} options={['Cash', 'UPI', 'Card']} size="sm" className="text-sm" />
                                    </div>
                                </form>
                            </div>

                            {/* --- FOOTER (FIXED) --- */}
                            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                                <button form="reg-form" type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 transform active:scale-[0.98]">
                                    Confirm & Generate Pass
                                </button>
                                <button type="button" onClick={() => setIsOverrideMode(true)} className="w-full text-[10px] text-red-500 hover:underline font-bold text-center py-1">
                                    Emergency Override (No Pass)
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* 3. PAYMENT MODAL */}
            {
                showPaymentModal && selectedPatient && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden transform scale-100">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-indigo-500" /> Payment
                                </h2>
                                <button onClick={() => setShowPaymentModal(false)}><XCircle className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Reusing prior payment logic UI simplified */}
                                {!isOverrideMode ? (
                                    <form onSubmit={handlePaymentSubmit} className="space-y-5">
                                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest mb-1">Consultation Fee</span>
                                            <span className="font-black text-3xl text-indigo-600">₹{selectedPatient?.amount || 500}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                                            <Select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} options={['Cash', 'UPI', 'Card']} className="text-sm" />
                                        </div>
                                        <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">Confirm & Generate Pass</button>
                                        <button type="button" onClick={() => setIsOverrideMode(true)} className="w-full text-[10px] text-red-500 hover:underline font-bold">Emergency Override (No Pass)</button>
                                    </form>
                                ) : (
                                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                        <div className="text-[10px] font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            Override bypasses payment collection and will NOT generate a consultation pass. Use only for emergencies.
                                        </div>
                                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="Reason for override..." rows="3" required value={paymentForm.overrideReason} onChange={e => setPaymentForm({ ...paymentForm, overrideReason: e.target.value })} />
                                        <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:shadow-lg shadow-red-500/30 transition-all text-sm">Confirm Override</button>
                                        <button type="button" onClick={() => setIsOverrideMode(false)} className="w-full text-xs text-slate-500 font-bold py-2">Cancel</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 4. VITALS MODAL */}
            {
                showVitalsModal && selectedPatient && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">

                        {/* FIXED: Removed 'mt-10', Reduced 'max-w-lg' to 'max-w-md' for a tighter look, removed overflow-y-auto */}
                        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2rem] shadow-2xl p-5 border border-slate-200 dark:border-slate-700 relative mt-20">

                            <button onClick={() => setShowVitalsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10">
                                <Minus className="w-6 h-6 rotate-45" /> {/* Close Icon */}
                            </button>

                            {/* COMPACT HEADER: mb-4 instead of mb-6 */}
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                Vitals Check
                            </h2>

                            {/* REUSE VITALS LOGIC */}
                            {reuseVitals ? (
                                <div className={`mb-4 p-3 rounded-2xl border relative overflow-hidden ${reuseVitals.isToday ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'}`}>
                                    <div className="absolute top-0 right-0 p-3 opacity-10"><RotateCcw className="w-16 h-16" /></div>
                                    <p className={`text-[10px] font-bold uppercase mb-2 flex items-center gap-2 ${reuseVitals.isToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                        {reuseVitals.isToday ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                        {reuseVitals.isToday ? 'Recorded Today' : `Last: ${reuseVitals.daysAgo} days ago`}
                                    </p>
                                    <div className="flex gap-6 mb-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height</span>
                                            <p className="font-black text-xl text-slate-800 dark:text-white">{reuseVitals.height}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</span>
                                            <p className="font-black text-xl text-slate-800 dark:text-white">{reuseVitals.weight} <span className="text-xs opacity-50">kg</span></p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleReuseVitals}
                                        className={`w-full py-2.5 font-bold rounded-xl text-xs hover:shadow-lg transition-all flex items-center justify-center gap-2 ${reuseVitals.isToday ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'}`}
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Reuse These Values
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No recent vitals found.</p>
                                </div>
                            )}

                            {/* FORM: Reduced space-y-6 to space-y-4 */}
                            <form onSubmit={handleVitalsSubmit} className="space-y-4">

                                {/* GRID: Height on Top, Weight on Bottom */}
                                <div className="grid grid-cols-2 gap-3">

                                    {/* HEIGHT (FEET) */}
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                                            Height (ft)
                                        </label>
                                        {/* COMPACT INPUT: h-12 instead of h-14 */}
                                        <div className="flex items-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-1 h-12">
                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => ({ ...p, feet: Math.max(1, Math.min(9, (Number(p.feet) || 0) - 1)) }))}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <div className="flex-1 flex items-baseline h-full pt-1">
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="9"
                                                    className="w-[55%] h-full bg-transparent font-black text-xl outline-none text-right pr-1 appearance-none no-spinner text-slate-900 dark:text-white"
                                                    placeholder="5"
                                                    value={vitalsForm.feet}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => setVitalsForm({ ...vitalsForm, feet: e.target.value })}
                                                    onBlur={e => {
                                                        let val = Number(e.target.value) || 0;
                                                        val = Math.max(1, Math.min(9, val));
                                                        setVitalsForm({ ...vitalsForm, feet: val });
                                                    }}
                                                />
                                                <span className="w-[45%] text-xs font-bold text-slate-500 dark:text-slate-400 text-left pl-1">ft</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => ({ ...p, feet: Math.min(9, (Number(p.feet) || 0) + 1) }))}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* HEIGHT (INCHES) */}
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                                            Height (in)
                                        </label>
                                        <div className="flex items-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-1 h-12">
                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => {
                                                    const currentInches = Number(p.inches) || 0;
                                                    const currentFeet = Number(p.feet) || 0;
                                                    if (currentInches === 0 && currentFeet > 1) {
                                                        return { ...p, feet: currentFeet - 1, inches: 11 };
                                                    }
                                                    return { ...p, inches: Math.max(0, currentInches - 1) };
                                                })}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <div className="flex-1 flex items-baseline h-full pt-1">
                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    className="w-[55%] h-full bg-transparent font-black text-xl outline-none text-right pr-1 appearance-none no-spinner text-slate-900 dark:text-white"
                                                    placeholder="0"
                                                    value={vitalsForm.inches}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => setVitalsForm({ ...vitalsForm, inches: e.target.value })}
                                                    onBlur={e => {
                                                        let val = Number(e.target.value) || 0;
                                                        let currentFeet = Number(vitalsForm.feet) || 0;
                                                        if (val >= 12) {
                                                            const extraFeet = Math.floor(val / 12);
                                                            val = val % 12;
                                                            currentFeet = Math.min(9, currentFeet + extraFeet);
                                                        }
                                                        setVitalsForm({ ...vitalsForm, feet: currentFeet, inches: val });
                                                    }}
                                                />
                                                <span className="w-[45%] text-xs font-bold text-slate-500 dark:text-slate-400 text-left pl-1">in</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => {
                                                    const currentInches = Number(p.inches) || 0;
                                                    const currentFeet = Number(p.feet) || 0;
                                                    if (currentInches >= 11 && currentFeet < 9) {
                                                        return { ...p, feet: currentFeet + 1, inches: 0 };
                                                    }
                                                    return { ...p, inches: currentInches + 1 };
                                                })}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* WEIGHT - Full Width Row */}
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                                            Weight
                                        </label>
                                        <div className="flex items-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-1 h-12">
                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => ({ ...p, weight: Math.max(1, ((Number(p.weight) || 0) - 0.5).toFixed(1)) }))}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <div className="flex-1 flex items-baseline h-full pt-1">
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.1"
                                                    min="1"
                                                    className="w-[55%] h-full bg-transparent font-black text-xl outline-none text-right pr-1 appearance-none no-spinner text-slate-900 dark:text-white"
                                                    placeholder="70"
                                                    value={vitalsForm.weight}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                                                    onBlur={e => setVitalsForm({ ...vitalsForm, weight: Math.max(1, Number(e.target.value) || 0) })}
                                                />
                                                <span className="w-[45%] text-xs font-bold text-slate-500 dark:text-slate-400 text-left pl-1">kg</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setVitalsForm(p => ({ ...p, weight: ((Number(p.weight) || 0) + 0.5).toFixed(1) }))}
                                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg active:scale-95 transition-all flex-shrink-0"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowVitalsModal(false)}
                                        className="flex-1 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-sm"
                                    >
                                        Update Vitals
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* 5. PASS DETAILS MODAL */}
            {
                showPassDetails && selectedPatient && selectedPatient.consultationPassId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-[2rem] shadow-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Pass Active</h2>
                            <p className="text-slate-500 mb-6 font-medium text-xs">This patient has a valid pass.</p>

                            <div className="bg-slate-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-slate-100 dark:border-emerald-900/20 mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-emerald-400 mb-0.5">
                                    {new Date(selectedPatient.consultationPassId.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs font-bold text-slate-500 dark:text-emerald-600">
                                    {new Date(selectedPatient.consultationPassId.validTo).toLocaleDateString()}
                                </p>
                            </div>
                            <button onClick={() => setShowPassDetails(false)} className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl transition shadow-xl text-sm">Close</button>
                        </div>
                    </div>
                )
            }

            {/* 6. DOCTOR SELECTION MODAL */}
            {
                showDoctorSelectModal && pendingPatient && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Stethoscope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Assign Doctor</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Select a doctor for <b>{pendingPatient.name}</b></p>
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                                {doctors.filter(d => d.availabilityStatus === 'Available').length === 0 && (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400">No doctors currently marked Available.</p>
                                    </div>
                                )}

                                {doctors.map(doc => {
                                    const isAvailable = doc.availabilityStatus === 'Available';
                                    if (!isAvailable) return null; // Show ONLY available doctors as per request

                                    return (
                                        <button
                                            key={doc._id}
                                            onClick={() => confirmAddToQueue(doc._id)}
                                            className="w-full p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl transition-all group text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                                {doc.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">Dr. {doc.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.specialization || 'General'}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-500" />
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => { setShowDoctorSelectModal(false); setPendingPatient(null); }}
                                className="w-full mt-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
