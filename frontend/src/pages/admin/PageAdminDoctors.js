import React, { useState, useEffect, useCallback, useRef } from "react";
import { registerStaffAPI, getUsersByRoleAPI } from "../../api";
import toast from "react-hot-toast";
import {
    UserPlus,
    Users,
    Briefcase,
    Phone,
    RefreshCw,
    Stethoscope,
    Clipboard,
    CheckCircle,
    Copy,
    X,
    Loader
} from "lucide-react";
import { useEnterNavigation } from "../../hooks/useEnterNavigation";

export default function PageAdminDoctors() {
    const [activeTab, setActiveTab] = useState("doctor");
    const [teamList, setTeamList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const formRef = useEnterNavigation();

    // Success Popup State
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        role: "doctor",
        specialization: "",
        qualification: "",
        experience: "",
        hospitalName: "",
        consultationFee: "",
        photo: null
    });

    // Fetch Team based on Active Tab
    const fetchTeam = useCallback(async () => {
        try {
            const res = await getUsersByRoleAPI(activeTab);
            setTeamList(res.data || []);
        } catch (err) {
            console.error("Failed to load team", err);
            toast.error("Failed to refresh list");
        }
    }, [activeTab]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.mobile) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (!validatePhone(formData.mobile)) {
            toast.error("Phone number must be exactly 10 digits.");
            return;
        }

        setLoading(true);

        try {
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'role' && formData[key] !== null) {
                    payload.append(key, formData[key]);
                }
            });
            payload.append('role', activeTab);

            const res = await registerStaffAPI(payload);

            setCreatedCredentials(res.data.credentials);
            setShowSuccessPopup(true);

            toast.success(res.data.message);

            setFormData({
                firstName: "",
                lastName: "",
                mobile: "",
                role: activeTab,
                specialization: "",
                qualification: "",
                experience: "",
                hospitalName: "",
                consultationFee: "",
                photo: null
            });
            setPhotoPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            fetchTeam();

        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!createdCredentials) return;
        const text = `Username: ${createdCredentials.username} \nPassword: ${createdCredentials.password} `;
        navigator.clipboard.writeText(text);
        toast.success("Credentials copied to clipboard!");
    };

    return (
        <div className="max-w-7xl mx-auto p-6 animate-fade-in-up">

            {/* SUCCESS POPUP */}
            {showSuccessPopup && createdCredentials && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in-up border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-center mb-6">
                            <div className="bg-emerald-100 dark:bg-emerald-500/10 p-4 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/20">
                                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">Registration Successful</h3>
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium">
                            Please share these credentials. The user will be prompted to change their password on first login.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</span>
                                <span className="font-mono font-black text-slate-900 dark:text-white text-lg">{createdCredentials.username}</span>
                            </div>
                            <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</span>
                                <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg">{createdCredentials.password}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm"
                            >
                                <Copy className="w-4 h-4" /> Copy
                            </button>
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Team Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Create and manage accounts for Doctors and Staff.</p>
            </div>

            {/* Modern Tab Switcher */}
            <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl w-fit shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <button
                    onClick={() => setActiveTab("doctor")}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'doctor'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Stethoscope className="w-4 h-4" /> Doctors
                </button>
                <button
                    onClick={() => setActiveTab("staff")}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'staff'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Clipboard className="w-4 h-4" /> Staff
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: REGISTRATION FORM --- */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className={`p-2 rounded-lg ${activeTab === 'doctor' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                                <UserPlus className="w-5 h-5" />
                            </div>
                            Add New {activeTab === 'doctor' ? 'Doctor' : 'Staff Member'}
                        </h3>

                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                        placeholder="e.g. Rahul"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                        placeholder="e.g. Patil"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            {activeTab === 'doctor' && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Specialization</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Briefcase className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                                placeholder="e.g. Cardiologist"
                                                value={formData.specialization}
                                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Qualification</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                            placeholder="e.g. MBBS, MD"
                                            value={formData.qualification || ''}
                                            onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Experience</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                            placeholder="e.g. 10+ Years"
                                            value={formData.experience || ''}
                                            onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Hospital Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                            placeholder="Default: Omisha Clinic"
                                            value={formData.hospitalName || ''}
                                            onChange={e => setFormData({ ...formData, hospitalName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Consultation Fee (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                            placeholder="Default: 500"
                                            value={formData.consultationFee || ''}
                                            onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Photo Upload</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData({ ...formData, photo: file });
                                                        setPhotoPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            {photoPreview && (
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 shrink-0">
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Mobile Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                        placeholder="10-digit number"
                                        value={formData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setFormData({ ...formData, mobile: val });
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">{formData.mobile.length}/10</p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                                <p className="font-bold mb-1">Note:</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li>Username will be auto-generated.</li>
                                    <li>Default password: <strong className="font-mono">123456</strong></li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 ${activeTab === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'} `}
                            >
                                {loading ? <Loader className="animate-spin w-5 h-5" /> : `Register ${activeTab === 'doctor' ? 'Doctor' : 'Staff'}`}
                            </button>

                        </form>
                    </div>
                </div>

                {/* --- RIGHT: EXISTING TEAM LIST --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" /> Active {activeTab === 'doctor' ? 'Doctors' : 'Staff'}
                            </h3>
                            <button
                                onClick={fetchTeam}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Refresh List"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {teamList.length > 0 ? (
                                teamList.map((user) => (
                                    <div key={user._id} className="relative p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group gap-4">
                                        <div className="flex items-center gap-4 pr-8 sm:pr-0">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl border ${activeTab === 'doctor' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'} `}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.name}</h4>
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {user.role === 'doctor' && (
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                            <Briefcase className="w-3 h-3" /> {user.specialization || "General"}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {user.mobile}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute top-2 right-2 sm:static flex items-center gap-3">
                                            {/* Availability only for Doctors */}
                                            {user.role === 'doctor' && (
                                                <div className="text-right mr-4 block">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Status</p>
                                                    <p className={`text-xs font-bold ${user.availabilityStatus === 'Available' ? 'text-emerald-500' : 'text-slate-400'} `}>
                                                        {user.availabilityStatus || "Offline"}
                                                    </p>
                                                </div>
                                            )}

                                            {/* More Actions Placeholder */}
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Users className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No {activeTab} accounts found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}