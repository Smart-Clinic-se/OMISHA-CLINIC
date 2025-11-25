import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientHistoryAPI, uploadReportAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import { Search, UploadCloud, FileText, X, CheckCircle, User, AlertCircle, Loader, ArrowLeft } from "lucide-react";

export default function PageStaffUpload() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null); // List of users found
    const [selectedPatient, setSelectedPatient] = useState(null); // Selected User
    const [targetRecordId, setTargetRecordId] = useState(null); // Medical Record ID to attach to
    const [loading, setLoading] = useState(false);

    // Upload State
    const [file, setFile] = useState(null);
    const [reportType, setReportType] = useState("Blood Test");
    const [uploading, setUploading] = useState(false);

    // 1. Search Registered Users (Name or Mobile)
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        setLoading(true);
        setSearchResults(null);
        setSelectedPatient(null);

        try {
            // Search the User Database
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/auth/users?role=patient&search=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                setSearchResults(data);
            } else {
                toast.error("No registered patient found with that Name or Mobile.");
                setSearchResults([]);
            }
        } catch (err) {
            toast.error("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Select Patient & Find latest Medical Record
    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setSearchResults(null); // Clear list
        setLoading(true);

        try {
            // Now try to find a medical record to attach the file to
            const res = await getPatientHistoryAPI({ patientId: patient._id });
            if (res.data.data && res.data.data.length > 0) {
                // Attach to the most recent visit
                setTargetRecordId(res.data.data[0]._id);
                toast.success(`Found medical file for ${patient.name}`);
            } else {
                setTargetRecordId(null);
                // Warn, but show patient is valid
                toast("Patient found, but no consultation history exists yet.", { icon: "ℹ️" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle File Selection
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 2 * 1024 * 1024) {
                toast.error("File too large! Max 2MB.");
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

        try {
            await uploadReportAPI(targetRecordId, formData);
            toast.success("Report uploaded successfully!");

            // Reset
            setFile(null);
            setReportType("Blood Test");

            // Optional: Navigate away or clear selection
            // navigate("/app/staff/dashboard"); 
        } catch (error) {
            console.error(error);
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-screen bg-slate-950">
            <button
                onClick={() => navigate("/app/staff/dashboard", { replace: true })}
                className="mb-4 flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* --- HEADER --- */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <UploadCloud className="w-8 h-8 text-blue-500" /> Upload Medical Reports
                </h1>
                <p className="text-slate-400 mt-2">Attach lab results and scans to patient records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: Search Card */}
                <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-800 h-fit">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" /> Find Patient
                    </h3>

                    {!selectedPatient ? (
                        <>
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Patient Name or Mobile</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-white placeholder-slate-500"
                                        placeholder="e.g. Sourabh or 98765..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-center"
                                >
                                    {loading ? <Loader className="animate-spin" /> : "Search Database"}
                                </button>
                            </form>

                            {/* Search Results List */}
                            {searchResults && (
                                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Select Patient:</p>
                                    {searchResults.map(p => (
                                        <div key={p._id} onClick={() => handleSelectPatient(p)} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition">
                                            <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs border border-blue-500/20">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{p.name}</p>
                                                <p className="text-xs text-slate-400">{p.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Selected Patient View */
                        <div className="animate-fade-in-up">
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold border border-emerald-500/20">
                                        {selectedPatient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{selectedPatient.name}</h3>
                                        <p className="text-xs text-slate-400">{selectedPatient.mobile}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPatient(null); setTargetRecordId(null); }} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {targetRecordId ? (
                                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                    <CheckCircle className="w-4 h-4" /> Medical File Ready
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>No Visit Record Found.</strong><br />
                                        This patient has registered but hasn't seen a doctor yet. Please wait for a consultation to complete before uploading reports.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Upload Card */}
                <div className={`bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-800 transition-all ${!targetRecordId ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <h3 className="font-bold text-white mb-6">Upload Document</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Report Type</label>
                            <select
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                value={reportType}
                                onChange={e => setReportType(e.target.value)}
                            >
                                <option>Blood Test</option>
                                <option>X-Ray</option>
                                <option>MRI Scan</option>
                                <option>CT Scan</option>
                                <option>Ultrasound</option>
                                <option>Prescription (External)</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition relative">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center pointer-events-none">
                                <UploadCloud className="w-10 h-10 text-purple-500 mb-3" />
                                <p className="text-sm font-bold text-slate-300">
                                    {file ? file.name : "Click to Select File"}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG (Max 2MB)</p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? "Uploading..." : <>Confirm Upload <CheckCircle className="w-4 h-4" /></>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}