import React, { useState, useEffect, useCallback } from "react";
// FIXED: Imported getUsersByRoleAPI
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
    X
} from "lucide-react";

export default function PageAdminDoctors() {
    const [activeTab, setActiveTab] = useState("doctor"); // 'doctor' or 'staff'
    const [teamList, setTeamList] = useState([]); // Stores the list of currently active tab
    const [loading, setLoading] = useState(false);

    // Success Popup State
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        // Password is now auto-generated
        role: "doctor",
        specialization: ""
    });

    // Fetch Team based on Active Tab
    const fetchTeam = useCallback(async () => {
        try {
            // Calls the new API: /auth/users?role=doctor OR /auth/users?role=staff
            const res = await getUsersByRoleAPI(activeTab);
            setTeamList(res.data || []);
        } catch (err) {
            console.error("Failed to load team", err);
            toast.error("Failed to refresh list");
        }
    }, [activeTab]);

    // Refetch whenever tab changes
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
            const payload = {
                ...formData,
                role: activeTab // 'doctor' or 'staff'
            };

            const res = await registerStaffAPI(payload);

            // Show Success Popup with Credentials
            setCreatedCredentials(res.data.credentials);
            setShowSuccessPopup(true);

            toast.success(res.data.message);

            // Reset Form
            setFormData({ firstName: "", lastName: "", mobile: "", role: activeTab, specialization: "" });

            // Refresh list
            fetchTeam();

        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!createdCredentials) return;
        const text = `Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
        navigator.clipboard.writeText(text);
        toast.success("Credentials copied to clipboard!");
    };

    return (
        <div className="max-w-6xl mx-auto p-6 relative">

            {/* SUCCESS POPUP */}
            {showSuccessPopup && createdCredentials && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">User Registered Successfully</h3>
                        <p className="text-center text-slate-500 mb-6">
                            Please share these temporary credentials with the user. They will be asked to change their password on first login.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-500 uppercase">Username</span>
                                <span className="font-mono font-bold text-slate-800">{createdCredentials.username}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500 uppercase">Password</span>
                                <span className="font-mono font-bold text-slate-800">{createdCredentials.password}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" /> Copy
                            </button>
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Team Management</h1>
                <p className="text-slate-400">Create and manage accounts for Doctors and Staff.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab("doctor")}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors ${activeTab === 'doctor' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Stethoscope className="w-5 h-5" /> Doctors
                </button>
                <button
                    onClick={() => setActiveTab("staff")}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors ${activeTab === 'staff' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Clipboard className="w-5 h-5" /> Staff
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: REGISTRATION FORM --- */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-sm sticky top-6">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${activeTab === 'doctor' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                <UserPlus className="w-5 h-5" />
                            </div>
                            Add New {activeTab === 'doctor' ? 'Doctor' : 'Staff Member'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* First Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">First Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                    placeholder="e.g. Rahul"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                    placeholder="e.g. Patil"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>

                            {/* Specialization (Doctors Only) */}
                            {activeTab === 'doctor' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Specialization</label>
                                    <div className="relative">
                                        <Briefcase className="absolute top-3.5 left-3 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                            placeholder="e.g. Cardiologist"
                                            value={formData.specialization}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mobile */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute top-3.5 left-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-10 p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                        placeholder="10-digit number"
                                        value={formData.mobile}
                                        onChange={e => {
                                            // Only allow numbers
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setFormData({ ...formData, mobile: val });
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 text-right">{formData.mobile.length}/10</p>
                            </div>

                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-xs text-blue-400 mb-2">
                                <p className="font-bold mb-1">Note:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Username will be auto-generated.</li>
                                    <li>Default password: <strong>123456</strong></li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg flex justify-center transition-transform active:scale-95 ${activeTab === 'doctor' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {loading ? "Creating..." : `Register ${activeTab === 'doctor' ? 'Doctor' : 'Staff'}`}
                            </button>

                        </form>
                    </div>
                </div>

                {/* --- RIGHT: EXISTING TEAM LIST --- */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5" /> Active {activeTab === 'doctor' ? 'Doctors' : 'Staff'}
                            </h3>
                            <button onClick={fetchTeam} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-full transition">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {teamList.length > 0 ? (
                                teamList.map((user) => (
                                    <div key={user._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl border ${activeTab === 'doctor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{user.name}</h4>
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    {/* Specialization only for doctors */}
                                                    {user.role === 'doctor' && (
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="w-3 h-3" /> {user.specialization || "General"}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {user.mobile}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Availability only for Doctors */}
                                            {user.role === 'doctor' && (
                                                <div className="text-right mr-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Availability</p>
                                                    <p className={`text-xs font-bold ${user.availabilityStatus === 'Available' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                        {user.availabilityStatus || "Offline"}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Delete button placeholder - Add functionality if needed */}
                                            <div className="h-8 w-8 bg-slate-800 rounded-full"></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Users className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No {activeTab} accounts found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}