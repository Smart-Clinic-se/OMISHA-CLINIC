import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import api, { getPatientHistoryAPI } from "../../api";
import {
    Search,
    User,
    ChevronRight,
    FileText,
    Calendar,
    Clock,
    Loader,
    AlertCircle,
    ArrowLeft,
    Droplet,
    Stethoscope,
    Phone
} from "lucide-react";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";

export default function PagePatientMedicalHistory() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const formRef = useEnterNavigation();

    // Auto-load if navigated from Dashboard
    useEffect(() => {
        if (location.state?.patientName) {
            setSearchQuery(location.state.patientName);
            handleSearch(null, location.state.patientName);
        }
    }, [location.state]);

    // --- REAL-TIME SEARCH (DEBOUNCE) ---
    // Automatically searches 500ms after you stop typing
    useEffect(() => {
        if (selectedPatient) return;

        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                handleSearch(null, searchQuery);
            } else {
                setSearchResults(null);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedPatient]);


    // 1. Search Logic
    const handleSearch = async (e, overrideQuery = null) => {
        if (e) e.preventDefault();
        const query = overrideQuery || searchQuery;
        if (!query) return;

        setLoading(true);

        try {
            const res = await api.get('/auth/users', {
                params: { role: 'patient', search: query }
            });
            const data = res.data;

            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. Select Patient Logic
    const handleSelectPatient = async (patient) => {
        setLoading(true);
        setSelectedPatient(patient);
        setSearchResults(null);

        try {
            const res = await getPatientHistoryAPI({ patientId: patient._id });
            setHistory(res.data.data || []);
        } catch (err) {
            console.error(err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // 3. Clear Selection
    const handleBack = () => {
        setSelectedPatient(null);
        handleSearch(null, searchQuery);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 animate-fade-in-up">
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                        <FileText className="w-6 h-6" />
                    </span>
                    Patient Records
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium ml-1 text-sm">Find patients and view their complete medical timeline.</p>
            </div>

            {/* --- VIEW 1: SEARCH BAR --- */}
            {!selectedPatient && (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 mb-6 sticky top-4 z-20 transition-all">
                    <form ref={formRef} onSubmit={(e) => handleSearch(e)} className="flex gap-3">
                        <div className="flex-1 relative group">
                            {/* FIXED: Vertical Center Alignment for Icon */}
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="Start typing Name or Mobile..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center min-w-[100px] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? <Loader className="animate-spin w-4 h-4" /> : "Search"}
                        </button>
                    </form>
                </div>
            )}

            {/* --- VIEW 2: SEARCH RESULTS LIST --- */}
            {searchResults && !selectedPatient && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="flex justify-between items-end px-2">
                        <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                            Found {searchResults.length} Patients
                        </h3>
                    </div>

                    {searchResults.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 font-medium text-sm">No patients found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {searchResults.map((patient) => (
                                <div
                                    key={patient._id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 transition-transform shadow-inner">
                                            {patient.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {patient.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                                                <User className="w-3 h-3" /> {patient.mobile || "No Mobile"}
                                            </p>

                                            {/* Preview Tags in Search Result */}
                                            <div className="mt-2 flex gap-1.5">
                                                {patient.gender && (
                                                    <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                        {patient.gender}
                                                    </span>
                                                )}
                                                {patient.age && (
                                                    <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                        {patient.age} Yrs
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 ml-auto group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- VIEW 3: SELECTED PATIENT HISTORY --- */}
            {selectedPatient && (
                <div className="space-y-6 animate-fade-in-up">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 font-bold transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Search Results
                    </button>

                    {/* Patient Header Card */}
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white dark:border-slate-700 shadow-lg text-slate-900 dark:text-white">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedPatient.name}</h2>

                                    {/* FIXED: Individual Pills - No more "Unknown" text, just hidden if missing */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <User className="w-3 h-3" />
                                            {selectedPatient.gender ? selectedPatient.gender : "Gender N/A"}
                                        </span>

                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <Calendar className="w-3 h-3" />
                                            {selectedPatient.age ? `${selectedPatient.age} Years` : "Age N/A"}
                                        </span>

                                        {selectedPatient.bloodGroup && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                                                <Droplet className="w-3 h-3" /> {selectedPatient.bloodGroup}
                                            </span>
                                        )}

                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            <Phone className="w-3 h-3" /> {selectedPatient.mobile}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2 mt-6 px-2">
                        <Calendar className="w-5 h-5 text-blue-500" /> Visit History
                    </h3>

                    {history.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Past Records</h3>
                            <p className="text-sm text-slate-500">This patient has not completed any consultations yet.</p>
                        </div>
                    ) : (
                        <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 pl-2 md:pl-0 pb-12">
                            {history.map((rec) => (
                                <div key={rec._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-8 last:mb-0">

                                    {/* Dot */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                                        <Clock className="w-4 h-4" />
                                    </div>

                                    {/* Card */}
                                    <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.01] hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 md:group-odd:text-right md:group-odd:items-end">
                                        <div className="flex justify-between items-start mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{new Date(rec.visitDate).toLocaleDateString()}</span>
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                                                <Stethoscope className="w-3 h-3" /> Dr. {rec.doctorName}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2 leading-tight">{rec.diagnosis}</h4>

                                        {rec.medicines?.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-sm border border-slate-100 dark:border-slate-700 mb-3">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1.5 tracking-wider">Prescription</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rec.medicines.map((m, idx) => (
                                                        <span key={idx} className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            {m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {rec.attachments?.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1.5 tracking-wider">Reports & Scans</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rec.attachments.map((file, i) => (
                                                        <a
                                                            key={i}
                                                            href={file.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg transition text-[10px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            {file.reportType}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}