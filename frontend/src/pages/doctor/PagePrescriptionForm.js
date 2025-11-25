import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addPrescriptionAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import {
    Printer,
    Plus,
    Trash2,
    AlertTriangle,
    X,
    Activity,
    Pill,
    CheckCircle,
    Droplet,
    ArrowLeft
} from "lucide-react";

export default function PagePrescriptionForm() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Data State
    const [formData, setFormData] = useState({
        queueId: "",
        tokenNumber: "",
        patientId: "",
        patientMobile: "",
        patientName: "",
        age: "",
        gender: "",
        bloodGroup: "", // Added Field

        // Clinical Fields
        symptoms: "",
        diagnosis: "",
        testsRequested: "",
        advice: "",
        notes: "",
        followUpDate: ""
    });

    // Medicine State
    const [medicines, setMedicines] = useState([]);
    const [currentMed, setCurrentMed] = useState({
        name: "",
        strength: "",
        dosageStyle: "1-0-1",
        duration: "5 Days",
        instruction: "After Food",
        notes: ""
    });

    // Load Initial Data
    useEffect(() => {
        if (location.state) {
            const { queueId, tokenNumber, patientId, patientName, patientMobile, age, gender, bloodGroup, chiefComplaint } = location.state;
            setFormData(prev => ({
                ...prev,
                queueId: queueId || "",
                tokenNumber: tokenNumber || "UNKNOWN",
                patientId: patientId || null,
                patientName: patientName || "Unknown",
                patientMobile: patientMobile || "",
                age: age || "",
                gender: gender || "",
                bloodGroup: bloodGroup || "Unknown", // Capture Blood Group
                symptoms: chiefComplaint || ""
            }));
        }
    }, [location.state]);

    // Helper: Dosage Explanation
    const getDosageLabel = (style) => {
        const map = {
            "1-0-0": "Morning",
            "1-0-1": "Morning & Night",
            "1-1-1": "Morning, Afternoon & Night",
            "0-0-1": "Night Only",
            "0-1-0": "Afternoon Only",
            "SOS": "When Needed"
        };
        return map[style] || style;
    };

    const handleAddMed = () => {
        if (!currentMed.name) return toast.error("Medicine Name is required");
        if (!currentMed.duration) return toast.error("Duration is required");

        setMedicines([...medicines, { ...currentMed }]);
        setCurrentMed({
            name: "",
            strength: "",
            dosageStyle: "1-0-1",
            duration: "5 Days",
            instruction: "After Food",
            notes: ""
        });
    };

    const handleRemoveMed = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handlePreview = () => {
        if (!formData.diagnosis) return toast.error("Diagnosis is required.");
        if (!formData.symptoms) return toast.error("Symptoms are required.");
        setShowPreview(true);
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                queueId: formData.queueId,
                tokenNumber: formData.tokenNumber,
                patientId: formData.patientId,
                doctorId: user._id,

                patientName: formData.patientName,
                patientMobile: formData.patientMobile,

                symptoms: formData.symptoms,
                diagnosis: formData.diagnosis,
                medicines: medicines,
                testsRequested: formData.testsRequested ? formData.testsRequested.split(',').map(s => s.trim()) : [],
                advice: formData.advice,
                notes: formData.notes,
                followUpDate: formData.followUpDate || null,

                isFinalized: true
            };

            await addPrescriptionAPI(payload);

            toast.success("Prescription Finalized & Saved!");
            navigate("/app/doctor/dashboard");

        } catch (error) {
            console.error("Prescription Error:", error);
            toast.error(error.response?.data?.message || "Failed to save.");
        } finally {
            setLoading(false);
            setShowPreview(false);
        }
    };

    if (!location.state && !formData.queueId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-700">No Patient Selected</h2>
                    <button onClick={() => navigate("/app/doctor/dashboard")} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <button
                onClick={() => navigate("/app/doctor/dashboard", { replace: true })}
                className="mb-4 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-mono font-bold text-lg">
                            #{formData.tokenNumber}
                        </span>
                        <h1 className="text-2xl font-bold text-slate-800">{formData.patientName}</h1>
                    </div>
                    <div className="flex gap-4 text-slate-500 text-sm mt-2 items-center">
                        <span>{formData.age} Yrs / {formData.gender}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{formData.patientMobile}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>

                        {/* BLOOD GROUP BADGE */}
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-100">
                            <Droplet className="w-3 h-3" /> {formData.bloodGroup}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="p-3 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Clinical Notes */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-blue-600" /> Clinical Assessment
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Symptoms (Complaints)</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                    placeholder="e.g. High fever, dry cough..."
                                    value={formData.symptoms}
                                    onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis *</label>
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    placeholder="e.g. Viral Fever"
                                    value={formData.diagnosis}
                                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lab Tests Requested</label>
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. CBC, Lipid Profile (comma separated)"
                                    value={formData.testsRequested}
                                    onChange={e => setFormData({ ...formData, testsRequested: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Doctor's Notes / Advice</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={2}
                                    placeholder="e.g. Drink plenty of water, rest..."
                                    value={formData.advice}
                                    onChange={e => setFormData({ ...formData, advice: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Follow-up Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.followUpDate}
                                    onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Rx (Medicines) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Pill className="w-5 h-5 text-emerald-600" /> Prescription (Rx)
                        </h3>

                        {/* Medicine Input Row */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="grid grid-cols-12 gap-3 mb-3">
                                <div className="col-span-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Name</label>
                                    <input
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="Paracetamol"
                                        value={currentMed.name}
                                        onChange={e => setCurrentMed({ ...currentMed, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Strength</label>
                                    <input
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="500mg"
                                        value={currentMed.strength}
                                        onChange={e => setCurrentMed({ ...currentMed, strength: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Pattern</label>
                                    <select
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none bg-white"
                                        value={currentMed.dosageStyle}
                                        onChange={e => setCurrentMed({ ...currentMed, dosageStyle: e.target.value })}
                                    >
                                        <option value="1-0-1">1-0-1 (Morn-Night)</option>
                                        <option value="1-0-0">1-0-0 (Morn)</option>
                                        <option value="0-0-1">0-0-1 (Night)</option>
                                        <option value="1-1-1">1-1-1 (All)</option>
                                        <option value="SOS">SOS (Needed)</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                                    <input
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="5 Days"
                                        value={currentMed.duration}
                                        onChange={e => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Instruction</label>
                                    <select
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none bg-white"
                                        value={currentMed.instruction}
                                        onChange={e => setCurrentMed({ ...currentMed, instruction: e.target.value })}
                                    >
                                        <option>After Food</option>
                                        <option>Before Food</option>
                                        <option>With Food</option>
                                        <option>Empty Stomach</option>
                                    </select>
                                </div>
                                <div className="col-span-5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Note</label>
                                    <input
                                        className="w-full p-2 rounded border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                                        placeholder="e.g. Drowsiness"
                                        value={currentMed.notes}
                                        onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        onClick={handleAddMed}
                                        className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-black text-sm font-bold flex justify-center items-center"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Medicine Table */}
                        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Medicine</th>
                                        <th className="p-4">Dosage</th>
                                        <th className="p-4">Instruction</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {medicines.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-slate-400 italic">
                                                No medicines added.
                                            </td>
                                        </tr>
                                    )}
                                    {medicines.map((med, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{med.name}</div>
                                                <div className="text-xs text-slate-500">{med.strength} • {med.duration}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold font-mono">
                                                    {med.dosageStyle}
                                                </span>
                                                <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase">
                                                    {getDosageLabel(med.dosageStyle)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {med.instruction}
                                                {med.notes && <div className="text-xs text-amber-600 italic">Note: {med.notes}</div>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleRemoveMed(i)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handlePreview}
                                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Preview & Finalize
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* === PREVIEW MODAL === */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">

                        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                            <div className="p-3 bg-red-100 rounded-full shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-800">Confirm Finalization</h3>
                                <p className="text-red-700 text-sm mt-1 leading-relaxed">
                                    You are about to finalize this record. Once confirmed, it <strong>cannot be edited</strong>.
                                    Corrections will require an <strong>Audit Amendment</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Diagnosis</p>
                                    <p className="text-lg font-bold text-slate-800">{formData.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Symptoms</p>
                                    <p className="text-sm text-slate-600">{formData.symptoms}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Prescribed Medicines ({medicines.length})</p>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-48 overflow-y-auto">
                                    {medicines.map((m, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                            <span className="font-bold text-slate-700 text-sm">{m.name} <span className="text-slate-400 font-normal">({m.strength})</span></span>
                                            <span className="text-xs font-mono bg-white border px-2 py-1 rounded">{m.dosageStyle}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl"
                            >
                                Edit / Back
                            </button>
                            <button
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex items-center gap-2"
                            >
                                {loading ? "Saving..." : "Confirm & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
