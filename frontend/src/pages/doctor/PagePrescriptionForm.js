import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { addPrescriptionAPI, searchMedicineAPI } from "../../api";
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
    ArrowLeft,
    Loader2,
    Shield
} from "lucide-react";
import Select from "../../components/ui/Select";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";

export default function PagePrescriptionForm() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const formRef = useEnterNavigation();

    // Data State
    const [formData, setFormData] = useState({
        queueId: "",
        tokenNumber: "",
        patientId: "",
        patientMobile: "",
        patientName: "",
        age: "",
        gender: "",
        bloodGroup: "",

        symptoms: "",
        diagnosis: "",
        secondaryDiagnosis: "", // [NEW] Secondary Diagnosis
        testsRequested: "",
        advice: "",
        notes: "",
        followUpDate: "",
        height: "",
        weight: "",
        occupation: "",
        isPrivate: false // [NEW] Privacy Toggle
    });

    // Medicine State
    const [medicines, setMedicines] = useState([]);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // [NEW] Loading State
    const [searchTimeout, setSearchTimeout] = useState(null); // [NEW] Debounce Timer

    const [currentMed, setCurrentMed] = useState({
        name: "",
        type: "", // [NEW] Type
        strength: "",
        dosageStyle: "1-0-1",
        duration: "5 Days",
        instruction: "After Food",
        notes: ""
    });

    // Load Initial Data
    useEffect(() => {
        if (location.state) {
            const { queueId, tokenNumber, patientId, patientName, patientMobile, age, gender, bloodGroup, chiefComplaint, height, weight, occupation } = location.state;
            setFormData(prev => ({
                ...prev,
                queueId: queueId || "",
                tokenNumber: tokenNumber || "UNKNOWN",
                patientId: patientId || null,
                patientName: patientName || "Unknown",
                patientMobile: patientMobile || "",
                age: age || "",
                gender: gender || "",
                bloodGroup: bloodGroup || "Unknown",
                symptoms: chiefComplaint || "",
                height: height || "",
                weight: weight || "",
                occupation: occupation || ""
            }));
        }
    }, [location.state]);

    // Autocomplete Logic (Server-Side Debounced)
    const handleSearchChange = (query) => {
        setCurrentMed(prev => ({ ...prev, name: query }));

        if (searchTimeout) clearTimeout(searchTimeout);

        if (!query || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        // Debounce 300ms
        const timeout = setTimeout(async () => {
            try {
                const response = await searchMedicineAPI(query);
                setSuggestions(response.data); // Assuming API returns array directly
                setShowSuggestions(true);
            } catch (error) {
                console.error("Search Error", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        setSearchTimeout(timeout);
    };

    const selectMedicine = (med) => {
        setCurrentMed(prev => ({
            ...prev,
            name: med.name,
            strength: med.strength || "",
            type: med.type || "", // Auto-fill Type
            dosageStyle: "1-0-1" // Reset or keep default? Let's keep default or we could map dosage_form if desired.
        }));
        setSuggestions([]);
        setShowSuggestions(false);
    };

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
            type: "", // Reset
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
                secondaryDiagnosis: formData.secondaryDiagnosis, // [NEW] Pass to backend
                medicines: medicines,
                testsRequested: formData.testsRequested ? formData.testsRequested.split(',').map(s => s.trim()) : [],
                advice: formData.advice,
                notes: formData.notes,
                followUpDate: formData.followUpDate || null,

                isPrivate: formData.isPrivate, // [NEW] Pass to backend

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Patient Selected</h2>
                    <p className="text-slate-500 mb-6">Please select a patient from the dashboard queue.</p>
                    <button onClick={() => navigate("/app/doctor/dashboard")} className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors font-bold">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={formRef} className="max-w-7xl mx-auto px-4 sm:px-6 animate-fade-in-up">
            <button
                onClick={() => navigate("/app/doctor/dashboard", { replace: true })}
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-4">
                        <span className="min-w-12 h-12 px-2 bg-blue-600 text-white rounded-xl flex items-center justify-center font-mono font-black text-xl shadow-lg shadow-blue-500/30">
                            {formData.tokenNumber}
                        </span>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formData.patientName}</h1>
                            <div className="flex gap-3 text-sm mt-1 items-center">
                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                    {(formData.age && formData.age !== 'N/A') ? `${formData.age} Yrs` : 'Age N/A'}
                                    {formData.gender ? `, ${formData.gender}` : ''}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                <span className="font-mono text-slate-500 dark:text-slate-400">{formData.patientMobile}</span>

                                {formData.bloodGroup && formData.bloodGroup !== "Unknown" && (
                                    <span className="ml-2 flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded border border-red-100 dark:border-red-500/20">
                                        <Droplet className="w-3 h-3" /> {formData.bloodGroup}
                                    </span>
                                )}
                            </div>

                            {/* [NEW] Vitals & Occupation Banner */}
                            <div className="flex flex-wrap gap-3 mt-3">
                                {formData.occupation && (
                                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                                        <span className="uppercase text-[10px] text-slate-400">Occupation:</span>
                                        {formData.occupation}
                                    </div>
                                )}
                                {(formData.height || formData.weight) && (
                                    <div className="flex items-center gap-3 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                                        {formData.height && (
                                            <div className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                                                <span className="uppercase text-[10px] text-orange-400 dark:text-orange-500/70">Ht:</span> {formData.height} cm
                                            </div>
                                        )}
                                        {formData.weight && (
                                            <div className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                                                <span className="uppercase text-[10px] text-orange-400 dark:text-orange-500/70">Wt:</span> {formData.weight} kg
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Clinical Notes */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <Activity className="w-5 h-5 text-blue-600" /> Clinical Assessment
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Symptoms (Complaints)</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none font-medium"
                                    rows={3}
                                    placeholder="e.g. High fever, dry cough..."
                                    value={formData.symptoms}
                                    onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Primary Diagnosis *</label>
                                <input
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="e.g. Viral Fever"
                                    value={formData.diagnosis}
                                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Secondary Diagnosis</label>
                                <input
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="e.g. Dehydration"
                                    value={formData.secondaryDiagnosis}
                                    onChange={e => setFormData({ ...formData, secondaryDiagnosis: e.target.value })}
                                />
                            </div>

                            {/* PRIVACY TOGGLE */}
                            <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <div className={`p-2 rounded-full ${formData.isPrivate ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Record Visibility</p>
                                    <p className="text-xs text-slate-500">
                                        {formData.isPrivate ? "Hidden from Patient (Staff/Doctor Only)" : "Visible to Patient"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isPrivate ? 'bg-rose-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isPrivate ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Lab Tests Requested</label>
                                <input
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium"
                                    placeholder="e.g. CBC, Lipid Profile"
                                    value={formData.testsRequested}
                                    onChange={e => setFormData({ ...formData, testsRequested: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Doctor's Notes / Advice</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none font-medium"
                                    rows={3}
                                    placeholder="e.g. Drink plenty of water..."
                                    value={formData.advice}
                                    onChange={e => setFormData({ ...formData, advice: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Follow-up Date</label>
                                <input
                                    type="date"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none text-slate-900 dark:text-white transition-all font-medium cursor-pointer"
                                    value={formData.followUpDate}
                                    onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                                    onClick={(e) => e.target.showPicker()}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Rx (Medicines) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[600px] flex flex-col">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <Pill className="w-5 h-5 text-emerald-600" /> Prescription
                        </h3>

                        {/* Medicine Input Row */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">

                            <div className="grid grid-cols-12 gap-5">
                                {/* ROW 1: Name, Type, Strength */}
                                <div className="col-span-12 md:col-span-6 relative">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Medicine Name</label>
                                    <div className="relative">
                                        <input
                                            className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400 font-bold"
                                            placeholder="Paracetamol"
                                            value={currentMed.name}
                                            onChange={e => handleSearchChange(e.target.value)}
                                            onFocus={() => {
                                                if (currentMed.name && currentMed.name.length >= 2) handleSearchChange(currentMed.name);
                                            }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            autoComplete="off"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Autocomplete Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-1 custom-scrollbar animate-fade-in-up">
                                            {suggestions.map((med, idx) => (
                                                <li
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        selectMedicine(med);
                                                    }}
                                                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-none transition-colors"
                                                >
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{med.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                        {med.strength ? `${med.strength} • ` : ''}
                                                        {med.type || med.dosage_form || 'Medicine'}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Type</label>
                                    <input
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400 font-medium"
                                        placeholder="Tablet"
                                        value={currentMed.type}
                                        onChange={e => setCurrentMed({ ...currentMed, type: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Strength</label>
                                    <input
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400 font-medium"
                                        placeholder="500mg"
                                        value={currentMed.strength}
                                        onChange={e => setCurrentMed({ ...currentMed, strength: e.target.value })}
                                    />
                                </div>

                                {/* ROW 2: Pattern, Duration, Instruction */}
                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Pattern</label>
                                    <Select
                                        name="dosageStyle"
                                        value={currentMed.dosageStyle}
                                        onChange={e => setCurrentMed({ ...currentMed, dosageStyle: e.target.value })}
                                        options={[
                                            "1-0-1",
                                            "1-0-0",
                                            "0-0-1",
                                            "1-1-1",
                                            "SOS"
                                        ]}
                                        className="w-full"
                                        size="sm"
                                    />
                                </div>

                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Duration</label>
                                    <Select
                                        name="duration"
                                        value={currentMed.duration}
                                        onChange={e => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                        options={[
                                            "1 Day", "2 Days", "3 Days", "4 Days", "5 Days", "7 Days",
                                            "10 Days", "15 Days",
                                            "1 Week", "2 Weeks", "3 Weeks",
                                            "1 Month", "2 Months", "3 Months",
                                            "Till Next Review"
                                        ]}
                                        className="w-full"
                                        size="sm"
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Instruction</label>
                                    <Select
                                        name="instruction"
                                        value={currentMed.instruction}
                                        onChange={e => setCurrentMed({ ...currentMed, instruction: e.target.value })}
                                        options={[
                                            "After Food",
                                            "Before Food",
                                            "With Food",
                                            "Empty Stomach"
                                        ]}
                                        className="w-full"
                                        size="sm"
                                    />
                                </div>

                                {/* ROW 3: Note, Add Button */}
                                <div className="col-span-12 md:col-span-9">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Note (Optional)</label>
                                    <input
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400"
                                        placeholder="e.g. Drowsiness"
                                        value={currentMed.notes}
                                        onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-3 flex items-end">
                                    <button
                                        onClick={handleAddMed}
                                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 text-sm font-bold flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6"></div>

                            {/* Medicine Table */}
                            {/* Medicine Table (Desktop) & Cards (Mobile) */}
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {/* DESKTOP: Table View */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                                            <tr>
                                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Medicine</th>
                                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Dosage</th>
                                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Instruction</th>
                                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                            {medicines.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="p-12 text-center text-slate-400 italic">
                                                        No medicines added yet. Use the form above.
                                                    </td>
                                                </tr>
                                            )}
                                            {medicines.map((med, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{med.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                            {med.strength && `${med.strength} • `}
                                                            {med.type && `${med.type} • `}
                                                            {med.duration}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold font-mono border border-blue-100 dark:border-blue-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                                            {med.dosageStyle}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wide">
                                                            {getDosageLabel(med.dosageStyle)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                                                        {med.instruction}
                                                        {med.notes && <div className="text-xs text-amber-500 italic mt-0.5 font-bold">Note: {med.notes}</div>}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleRemoveMed(i)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Remove">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE: Card View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                                    {medicines.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 italic text-sm">
                                            No medicines added yet.
                                        </div>
                                    )}
                                    {medicines.map((med, i) => (
                                        <div key={i} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-base">{med.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                        {med.strength && `${med.strength} • `}
                                                        {med.type && `${med.type} • `}
                                                        {med.duration}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMed(i)}
                                                    className="p-2 -mr-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold font-mono border border-blue-100 dark:border-blue-800 shrink-0">
                                                    {med.dosageStyle}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                                                    {med.instruction}
                                                </div>
                                            </div>

                                            {med.notes && (
                                                <div className="text-xs text-amber-600 dark:text-amber-500 italic mt-2 font-medium bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded-md inline-block">
                                                    Note: {med.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-6 flex justify-end pt-6 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={handlePreview}
                                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Preview & Finalize
                                </button>
                            </div>
                        </div>
                    </div>

                </div>



            </div>

            {/* === PREVIEW MODAL === */}
            {showPreview && createPortal(
                <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
                    <div className="max-w-3xl mx-auto min-h-screen flex flex-col">

                        {/* Sticky Header */}
                        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                Review
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 md:px-4 md:py-2 bg-slate-100 dark:bg-slate-800 rounded-full md:rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-sm"
                                >
                                    <X className="w-5 h-5 md:hidden" />
                                    <span className="hidden md:inline">Edit</span>
                                </button>
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={loading}
                                    className="px-5 py-2 md:px-6 md:py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 text-sm md:text-base"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {loading ? "Saving..." : "Finalize"}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4 md:p-8 space-y-8">
                            {/* Warning Banner */}
                            <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-rose-900/40 rounded-full shrink-0 shadow-sm">
                                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">Cannot be Edited Later</h3>
                                    <p className="text-rose-600/80 dark:text-rose-300/80 text-sm mt-1 font-medium leading-relaxed">
                                        Please review carefully. Once you click "Finalize", this prescription will be generated permanently.
                                    </p>
                                </div>
                            </div>

                            {/* Patient Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formData.patientName}</p>
                                        <p className="text-sm font-medium text-slate-500">{formData.age || 'N/A'} Yrs • {formData.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnosis</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formData.diagnosis}</p>
                                        {formData.secondaryDiagnosis && <p className="text-sm text-slate-500 mt-1">Sec: {formData.secondaryDiagnosis}</p>}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms</p>
                                        <p className="text-base font-medium text-slate-700 dark:text-slate-300">{formData.symptoms}</p>
                                    </div>
                                    {formData.advice && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note / Advice</p>
                                            <p className="text-base font-medium text-slate-700 dark:text-slate-300">{formData.advice}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Medicines List */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Pill className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prescribed Medicines ({medicines.length})</h3>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                    {medicines.map((m, i) => (
                                        <div key={i} className="p-4 flex justify-between items-center group">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                                    {m.strength && `${m.strength} • `} {m.instruction}
                                                    {m.notes && <span className="text-amber-500 ml-2 italic">({m.notes})</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-xs whitespace-nowrap">
                                                    {m.dosageStyle}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 block tracking-wide whitespace-nowrap">{m.duration}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Spacing (Bottom padding for mobile) */}
                        <div className="h-12 md:h-0"></div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}