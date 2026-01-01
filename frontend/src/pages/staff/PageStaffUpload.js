import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientHistoryAPI, uploadReportAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import {
    Search,
    UploadCloud,
    FileText,
    X,
    CheckCircle,
    User,
    AlertCircle,
    Loader,
    ArrowLeft,
    Files,
    Shield // [NEW]
} from "lucide-react";
import Select from "../../components/ui/Select";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";

export default function PageStaffUpload() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [targetRecordId, setTargetRecordId] = useState(null);
    const [loading, setLoading] = useState(false);

    const formRef = useEnterNavigation();
    const searchTimeoutRef = useRef(null);

    // Upload State
    const [file, setFile] = useState(null);
    const [reportType, setReportType] = useState("Blood Test Report");
    const [isPrivate, setIsPrivate] = useState(false); // [NEW]
    const [uploading, setUploading] = useState(false);

    // 1. Search Logic
    const performSearch = async (query) => {
        if (!query) {
            setSearchResults(null);
            return;
        }

        setLoading(true);
        setSearchResults(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/auth/users?role=patient&search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                setSearchResults(data);
            } else {
                // Don't toast on live search to avoid spam
                setSearchResults([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(searchQuery);
            }, 500);
        } else {
            setSearchResults(null);
        }
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(searchQuery);
    };

    // 2. Select Patient
    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setSearchResults(null);
        setLoading(true);

        try {
            const res = await getPatientHistoryAPI({ patientId: patient._id });
            if (res.data.data && res.data.data.length > 0) {
                setTargetRecordId(res.data.data[0]._id);
                toast.success(`Record found for ${patient.name}`);
            } else {
                setTargetRecordId(null);
                toast("No consultation record found.", { icon: "⚠️" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle File
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            // Strict File Type Validation
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(selected.type)) {
                toast.error("Invalid file type! Only PDF and Images are allowed.");
                return;
            }

            // Increased Limit to 10MB
            if (selected.size > 10 * 1024 * 1024) {
                toast.error("File too large! Max 10MB.");
                return;
            }
            setFile(selected);
        }
    };

    // 4. Upload Logic
    const handleUpload = async () => {
        if (!file || !targetRecordId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('reportType', reportType);
        formData.append('isPrivate', isPrivate); // [NEW]

        try {
            await uploadReportAPI(targetRecordId, formData);
            toast.success("Report uploaded successfully!");
            setFile(null);
            setReportType("Blood Test Report");
        } catch (error) {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 animate-fade-in-up">

            {/* --- HEADER --- */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                        <Files className="w-8 h-8" />
                    </span>
                    Upload Reports
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium ml-1">Attach lab results and scans to patient records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* --- LEFT: SEARCH PATIENT --- */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <Search className="w-5 h-5 text-blue-500" /> Find Patient
                    </h3>

                    {!selectedPatient ? (
                        <>
                            <form ref={formRef} onSubmit={handleSearch} className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="Enter Name or Mobile..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {loading && (
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-center shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    {loading ? <Loader className="animate-spin" /> : "Search Database"}
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults && (
                                <div className="mt-6 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Select Patient:</p>
                                    {searchResults.map(p => (
                                        <div key={p._id} onClick={() => handleSelectPatient(p)} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer transition-all duration-200 group">
                                            <div className="w-12 h-12 shrink-0 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-black text-lg border border-slate-200 dark:border-slate-600 shadow-sm group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-transform">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">{p.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Selected Patient View */
                        <div className="animate-fade-in-up">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-black text-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {selectedPatient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{selectedPatient.mobile}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setSelectedPatient(null); setTargetRecordId(null); }} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {targetRecordId ? (
                                <div className="flex items-center gap-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                                    <CheckCircle className="w-5 h-5" /> Medical File Ready
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="block mb-1">No Consultation Record</strong>
                                        Patient hasn't seen a doctor yet.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- RIGHT: UPLOAD DOCUMENT --- */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center">

                    {!targetRecordId ? (
                        /* EMPTY STATE */
                        <div className="text-center opacity-50">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UploadCloud className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Upload Waiting</h3>
                            <p className="text-slate-500 dark:text-slate-400">Select a patient on the left to enable document upload.</p>
                        </div>
                    ) : (
                        /* UPLOAD FORM (Only shows when valid) */
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                                <FileText className="w-5 h-5 text-purple-500" /> Document Details
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Report Type</label>
                                <div className="relative">
                                    <Select
                                        name="reportType"
                                        value={reportType}
                                        onChange={e => setReportType(e.target.value)}
                                        options={[
                                            "Blood Test Report",
                                            "X-Ray Report / Analysis",
                                            "MRI Radiologist Report",
                                            "CT Scan Report",
                                            "Ultrasound Report",
                                            "Prescription (External)",
                                            "Other"
                                        ]}
                                        className="w-full"
                                    />
                                </div>
                            </div>


                            {/* PRIVACY TOGGLE */}
                            <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <div className={`p-2 rounded-full ${isPrivate ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Report Visibility</p>
                                    <p className="text-xs text-slate-500">
                                        {isPrivate ? "Hidden from Patient" : "Visible to Patient"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-rose-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                </button>
                            </div>

                            <div className={`group border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 sm:p-10 text-center hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-400 transition-colors relative cursor-pointer ${file ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-400' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center pointer-events-none relative z-10">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${file ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'}`}>
                                        {file ? <CheckCircle className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                                    </div>
                                    <p className="text-base font-bold text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                                        {file ? file.name : "Click to Browse File"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">PDF, PNG, JPG (Max 10MB)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                <p>Please upload the <strong>final written report</strong> (PDF/Image). Do not upload raw DICOM files or entire folders.</p>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95 transform"
                            >
                                {uploading ? (
                                    <><Loader className="animate-spin w-5 h-5" /> Uploading...</>
                                ) : (
                                    <>Confirm Upload <CheckCircle className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}