import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getDoctorsAPI, addToQueueAPI } from "../../api";
import toast from "react-hot-toast";
import {
    Stethoscope,
    Clock,
    Calendar,
    User,
    Phone,
    CheckCircle,
    AlertCircle,
    ArrowLeft
} from "lucide-react";

export default function PageBookAppointment() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [visitType, setVisitType] = useState("New");
    const [symptoms, setSymptoms] = useState("");

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
        fetchDoctors();
    }, []);

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
                visitType: visitType, // Now user can select
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
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(`/app/patient/queue`, { replace: true })}
                    className="mb-4 flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Live Queue
                </button>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-white">Book Appointment</h1>
                    <p className="text-slate-400">Secure your spot in the live queue.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Doctor Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" /> Select Physician
                        </h3>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {loading ? <p className="text-slate-400">Loading...</p> : doctors.length === 0 ? (
                                <div className="p-6 bg-slate-900/50 rounded-xl text-center border border-slate-800 text-slate-400">
                                    No doctors online.
                                </div>
                            ) : (
                                doctors.map((doc) => (
                                    <div
                                        key={doc._id}
                                        onClick={() => setSelectedDoctor(doc._id)}
                                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex items-center gap-4 ${selectedDoctor === doc._id
                                            ? "bg-blue-500/10 border-blue-500 shadow-md"
                                            : "bg-slate-900/50 border-transparent hover:border-blue-500/30 shadow-sm"
                                            }`}
                                    >
                                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg border border-blue-500/20">
                                            {doc.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Dr. {doc.name}</h4>
                                            <p className="text-xs text-blue-400 font-bold uppercase">{doc.specialization || "General"}</p>
                                            {doc.availabilityStatus === 'On Break' && (
                                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded mt-1 inline-block border border-amber-500/20">On Break</span>
                                            )}
                                        </div>
                                        {selectedDoctor === doc._id && <CheckCircle className="ml-auto w-6 h-6 text-blue-500" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Appointment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-xl shadow-black/20 border border-slate-800 p-8 relative overflow-hidden">
                            {/* Decorative Top Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

                            {selectedDoctor ? (
                                <div className="space-y-6 animate-fade-in-up">

                                    {/* Patient Summary */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded-full border border-slate-800"><User className="w-5 h-5 text-slate-400" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Patient</p>
                                                <p className="font-bold text-white">{user.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded-full border border-slate-800"><Phone className="w-5 h-5 text-slate-400" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Contact</p>
                                                <p className="font-bold text-white">{user.mobile}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded-full border border-slate-800"><Calendar className="w-5 h-5 text-slate-400" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                                                <p className="font-bold text-white">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Fields */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Visit Type</label>
                                            <select
                                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-white"
                                                value={visitType}
                                                onChange={(e) => setVisitType(e.target.value)}
                                            >
                                                <option value="New">New Consultation</option>
                                                <option value="Follow-up">Follow-up Visit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Department</label>
                                            <input disabled value="General Medicine" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-500 font-medium cursor-not-allowed" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chief Complaint / Symptoms *</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe your symptoms briefly (e.g. Fever, Headache...)"
                                            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white placeholder-slate-500"
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                                        <button
                                            onClick={handleBook}
                                            disabled={submitting}
                                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 disabled:opacity-70 flex items-center gap-2 transition-transform hover:-translate-y-1"
                                        >
                                            {submitting ? "Processing..." : "Confirm Appointment"}
                                        </button>
                                    </div>

                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                                    <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Select a doctor from the list to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}