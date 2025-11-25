import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getPatientHistoryAPI } from "../../api";
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
    Droplet // For Blood Group
} from "lucide-react";

export default function PagePatientMedicalHistory() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null); // List of patients found
    const [selectedPatient, setSelectedPatient] = useState(null); // One specific patient
    const [history, setHistory] = useState([]); // Medical records of selected patient
    const [loading, setLoading] = useState(false);

    // Auto-load if navigated from Dashboard
    useEffect(() => {
        if (location.state?.patientName) {
            setSearchQuery(location.state.patientName);
            handleSearch(null, location.state.patientName);
        }
    }, [location.state]);

    // 1. Search Logic (Find Users)
    const handleSearch = async (e, overrideQuery = null) => {
        if (e) e.preventDefault();
        const query = overrideQuery || searchQuery;
        if (!query) return;

        setLoading(true);
        setSearchResults(null);
        setSelectedPatient(null);

        try {
            // We use the raw fetch here to pass the 'search' query param to the auth/users endpoint
            // This searches the User Database, not the Medical History Database
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/auth/users?role=patient&search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

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

    // 2. Select Patient Logic (Fetch their History)
    const handleSelectPatient = async (patient) => {
        setLoading(true);
        setSelectedPatient(patient);
        setSearchResults(null); // Clear list to show details view

        try {
            // Now fetch history for this specific patient ID
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
        setSearchQuery("");
    };

    return (
        <div className="max-w-5xl mx-auto p-6 min-h-screen bg-slate-950">
            <button
                onClick={() => navigate("/app/doctor/dashboard", { replace: true })}
                className="mb-4 flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* --- HEADER --- */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-500" /> Patient Records
                </h1>
                <p className="text-slate-400 mt-2">Find patients and view their complete medical timeline.</p>
            </div >

            {/* --- VIEW 1: SEARCH BAR --- */}
            {
                !selectedPatient && (
                    <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-800 mb-8 sticky top-4 z-20">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-lg font-medium text-white placeholder-slate-500"
                                    placeholder="Search by Name or Mobile..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center justify-center min-w-[120px]"
                            >
                                {loading ? <Loader className="animate-spin" /> : "Search"}
                            </button>
                        </form>
                    </div>
                )
            }

            {/* --- VIEW 2: SEARCH RESULTS LIST --- */}
            {
                searchResults && !selectedPatient && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex justify-between items-end px-2">
                            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">
                                Found {searchResults.length} Patients
                            </h3>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800">
                                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No patients found matching "{searchQuery}"</p>
                            </div>
                        ) : (
                            searchResults.map(p => (
                                <div
                                    key={p._id}
                                    onClick={() => handleSelectPatient(p)}
                                    className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 cursor-pointer flex justify-between items-center hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-500/20">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{p.name}</h4>
                                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                <span>{p.mobile}</span>
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                <span>{p.gender}, {p.age}y</span>
                                                {p.bloodGroup && (
                                                    <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-500/20 flex items-center gap-1">
                                                        <Droplet className="w-3 h-3" /> {p.bloodGroup}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        )}
                    </div>
                )
            }

            {/* --- VIEW 3: SELECTED PATIENT DETAILS --- */}
            {
                selectedPatient && (
                    <div className="animate-fade-in-up">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 mb-6 font-bold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Search
                        </button>

                        {/* Patient Header Card */}
                        <div className="bg-slate-900/80 backdrop-blur-md text-white p-8 rounded-3xl mb-10 shadow-2xl relative overflow-hidden border border-slate-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-black border border-white/10">
                                        {selectedPatient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">{selectedPatient.name}</h2>
                                        <p className="text-slate-400 mt-1 font-mono">{selectedPatient.mobile}</p>
                                        <div className="flex gap-3 mt-3 text-sm font-medium">
                                            <span className="bg-white/10 px-3 py-1 rounded-lg text-slate-300">{selectedPatient.gender}, {selectedPatient.age} yrs</span>
                                            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg flex items-center gap-2">
                                                <Droplet className="w-3 h-3" /> {selectedPatient.bloodGroup || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 md:mt-0 text-right">
                                    <div className="text-4xl font-black text-blue-400">{history.length}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Visits</div>
                                </div>
                            </div>
                        </div>

                        {/* History Timeline */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" /> Visit History
                            </h3>

                            {history.length === 0 ? (
                                <div className="text-center py-16 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800">
                                    <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-slate-400">No Past Records</h3>
                                    <p className="text-slate-500">This patient has not completed any consultations yet.</p>
                                </div>
                            ) : (
                                <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800">
                                    {history.map((rec, index) => (
                                        <div key={rec._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">

                                            {/* Dot */}
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-950 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 bg-blue-600 text-white">
                                                <Clock className="w-5 h-5" />
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">{new Date(rec.visitDate).toLocaleDateString()}</span>
                                                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">Dr. {rec.doctorName}</span>
                                                </div>

                                                <h4 className="font-bold text-white text-lg mb-2">{rec.diagnosis}</h4>

                                                {rec.medicines?.length > 0 && (
                                                    <div className="bg-slate-800/50 p-3 rounded-xl text-sm text-slate-300 border border-slate-700">
                                                        <span className="font-bold text-slate-500 text-xs uppercase block mb-1">Prescription</span>
                                                        {rec.medicines.map(m => m.name).join(', ')}
                                                    </div>
                                                )}

                                                {rec.attachments?.length > 0 && (
                                                    <div className="mt-3 bg-slate-800/50 p-3 rounded-xl text-sm text-slate-300 border border-slate-700">
                                                        <span className="font-bold text-slate-500 text-xs uppercase block mb-2">Reports & Scans</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {rec.attachments.map((file, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={file.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition text-xs font-bold"
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
                    </div>
                )}
        </div>
    );
}