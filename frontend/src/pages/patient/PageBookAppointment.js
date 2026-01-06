import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getDoctorsAPI, addToQueueAPI, getActivePassAPI, listenToDoctorStatus } from "../../api";
import toast from "react-hot-toast";
import {
    Stethoscope,
    Calendar,
    User,
    Phone,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Clock,
    CreditCard
} from "lucide-react";
import Select from "../../components/ui/Select";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";

export default function PageBookAppointment() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activePass, setActivePass] = useState(null);

    const formRef = useEnterNavigation();

    // Form State
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [visitType, setVisitType] = useState("New");
    const [symptoms, setSymptoms] = useState("");

    // Derived State
    const selectedDocData = doctors.find(d => d._id === selectedDoctor);
    const consultationFee = selectedDocData?.consultationFee || 500; // Default if missing

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await getDoctorsAPI();
                // Filter: Show 'Available' and 'On Break'
                const activeDoctors = res.data.filter(doc =>
                    doc.availabilityStatus === 'Available' ||
                    doc.availabilityStatus === 'On Break'
                );
                setDoctors(activeDoctors);
            } catch (err) {
                toast.error("Failed to load doctors.");
            } finally {
                setLoading(false);
            }
        };

        const fetchActivePass = async () => {
            if (!user?._id) return;
            try {
                const res = await getActivePassAPI(user._id);
                setActivePass(res.data.data);
            } catch (err) {
                console.error("Failed to fetch active pass", err);
            }
        };

        fetchDoctors();
        fetchActivePass();

        // Real-time Status Update
        const cleanup = listenToDoctorStatus((payload) => {
            setDoctors(prev => {
                const updated = prev.map(doc => {
                    if (doc._id === payload.doctorId) {
                        return { ...doc, availabilityStatus: payload.status, breakUntil: payload.breakUntil };
                    }
                    return doc;
                });
                // Re-filter if necessary (keep them in state, but UI logic handles display? 
                // Actually the API call filtered them. So if status changes to 'Left', they should be removed?
                // Or if a new doctor becomes available, they should be added? 
                // Since this state was initialized with ONLY active doctors, updating status might make them inconsistent.
                // Better approach: Re-fetch or handle filter. 
                // For now, let's just update the status. If they go 'Left', they might stay in list but show status? 
                // The current list only showed Available/On Break. 
                // If a doctor goes 'Left', we should probably remove them. 
                // If a doctor comes 'Available', we won't see them unless we re-fetch or have the full list.
                // Decision: Re-fetch is safer for consistency here, OR keep full list and filter in render.
                // Given the API filters on client side (lines 45-48), I should probably keep full list in state and filter in render?
                // The current code sets `doctors` to the filtered list.
                // Let's just re-fetch for simplicity and correctness in this specific filtered context.
                fetchDoctors();
                return updated; // This return is ignored by fetchDoctors call but satisfies setDoctors callback structure if needed, 
                // but actually I should just call fetchDoctors.
            });
        });
        return cleanup;
    }, [user._id]);

    const handleBook = async () => {
        if (!selectedDoctor) return toast.error("Please select a doctor");
        if (!symptoms.trim()) return toast.error("Please describe your symptoms");

        setSubmitting(true);

        try {
            await addToQueueAPI({
                patientName: user.name,
                patientId: user._id,
                patientMobile: user.mobile,
                assignedTo: selectedDoctor,
                chiefComplaint: symptoms,
                bookingSource: "Online",
                visitType: visitType,
                age: user.age || 0,
                gender: user.gender || "Other"
            });

            toast.success(`Appointment Confirmed! Token Generated.`, { icon: "🎉", duration: 4000 });
            setTimeout(() => navigate("/app/patient/queue"), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Booking failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-6xl mx-auto p-4 animate-fade-in-up">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Doctor Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 uppercase text-xs tracking-wider">
                        <Stethoscope className="w-4 h-4 text-blue-500" /> Select Physician
                    </h3>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Loading Physicians...</div>
                        ) : doctors.length === 0 ? (
                            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                                No doctors available right now.
                            </div>
                        ) : (
                            doctors.map((doc) => (
                                <div
                                    key={doc._id}
                                    onClick={() => setSelectedDoctor(doc._id)}
                                    className={`
                                        group relative p-3 sm:p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 flex items-center gap-3 sm:gap-4
                                        ${selectedDoctor === doc._id
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md"
                                            : "bg-white dark:bg-slate-800 border-transparent hover:border-blue-300 dark:hover:border-blue-700 shadow-sm"
                                        }
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border
                                        ${selectedDoctor === doc._id
                                            ? "bg-blue-500 text-white border-blue-600"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                                        }
                                    `}>
                                        {doc.name.charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Dr. {doc.name}</h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">{doc.specialization || "General"}</p>

                                        {/* Status Tag */}
                                        {doc.availabilityStatus === 'On Break' ? (
                                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                <Clock className="w-3 h-3" /> On Break
                                            </span>
                                        ) : (
                                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                <CheckCircle className="w-3 h-3" /> Available
                                            </span>
                                        )}
                                    </div>

                                    {/* Checkmark */}
                                    {selectedDoctor === doc._id && (
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Appointment Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-6 sm:p-8 relative overflow-hidden transition-colors duration-300">
                        {/* Decorative Top Bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>

                        {selectedDoctor ? (
                            <div ref={formRef} className="space-y-8 animate-fade-in-up">

                                {/* Active Pass Banner */}
                                {activePass && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse-subtle">
                                        <div>
                                            <h4 className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm uppercase tracking-wide">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Active Medical Pass
                                            </h4>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                                                Free follow-up available until {new Date(activePass.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <div className="text-right bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-sm">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Valid For</span>
                                            <span className="block font-black text-emerald-600 dark:text-emerald-400">
                                                {Math.ceil((new Date(activePass.validTo) - new Date()) / (1000 * 60 * 60 * 24))} Days
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Patient Summary Card */}
                                {/* Patient Summary Card */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><User className="w-5 h-5 text-slate-500" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><Phone className="w-5 h-5 text-slate-500" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{user.mobile}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><Calendar className="w-5 h-5 text-slate-500" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Inputs */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Visit Type</label>
                                            <Select
                                                name="visitType"
                                                value={visitType}
                                                onChange={(e) => setVisitType(e.target.value)}
                                                options={[
                                                    { value: "New", label: "New Consultation" },
                                                    { value: "Follow-up", label: "Follow-up Visit" }
                                                ]}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Consultation Fee</label>
                                            <div className="w-full p-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold flex justify-between items-center">
                                                <span>₹ {consultationFee}</span>
                                                <span className="text-[10px] uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Pay at Clinic</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Chief Complaint / Symptoms *</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Describe your symptoms briefly (e.g. Fever, Headache...)"
                                            className="w-full p-4 rounded-xl outline-none transition-all
                                                bg-slate-50 dark:bg-slate-900 
                                                border border-slate-200 dark:border-slate-700 
                                                text-slate-900 dark:text-white 
                                                placeholder-slate-400 
                                                focus:bg-white dark:focus:bg-slate-950 
                                                focus:ring-2 focus:border-transparent focus:ring-blue-500
                                                shadow-sm resize-none"
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="text-xs text-slate-400 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> Payment will be collected at the reception.
                                    </div>
                                    <button
                                        type="submit"
                                        onClick={handleBook}
                                        disabled={submitting}
                                        className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        {submitting ? "Processing..." : "Confirm Appointment"}
                                    </button>
                                </div>

                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Physician Selected</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Please select a doctor from the list on the left to proceed with booking.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}