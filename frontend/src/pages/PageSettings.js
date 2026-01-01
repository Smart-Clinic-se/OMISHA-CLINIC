import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../context/ThemeContext";
import { changePasswordAPI, updateProfilePhotoAPI, updateProfileAPI } from "../api";
import toast from "react-hot-toast";
import { User, Shield, Lock, HelpCircle, Eye, EyeOff, Moon, Sun, Laptop, Loader, Camera, Stethoscope, Building, Award, Clock } from "lucide-react";
import { useEnterNavigation } from "../hooks/useEnterNavigation";

export default function PageSettings() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "", securityAnswer: "" });
    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);

    // Doctor Profile State
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        consultationFee: user?.consultationFee || "",
        qualification: user?.qualification || "",
        experience: user?.experience || "",
        hospitalName: user?.hospitalName || "",
        specialization: user?.specialization || ""
    });

    // Fix: Sync local state when user updates from background refresh
    React.useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                consultationFee: user.consultationFee || "",
                qualification: user.qualification || "",
                experience: user.experience || "",
                hospitalName: user.hospitalName || "",
                specialization: user.specialization || ""
            }));
        }
    }, [user]);

    const formRef = useEnterNavigation();

    // Password Visibility State
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePhotoUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoLoading(true);
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const res = await updateProfilePhotoAPI(formData);
            if (res.data.success) {
                toast.success("Profile photo updated!");
                // Reload to reflect changes since we don't have a direct setUser from context here
                window.location.reload();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update photo");
        } finally {
            setPhotoLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match.");
            return;
        }

        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (user?.securityQuestion && !passwords.securityAnswer) {
            toast.error("Please answer the security question.");
            return;
        }

        setLoading(true);

        try {
            const res = await changePasswordAPI({
                userId: user._id,
                currentPassword: passwords.current,
                newPassword: passwords.new,
                securityAnswer: passwords.securityAnswer
            });

            if (res.data.success) {
                toast.success("Password updated successfully!");
                setPasswords({ current: "", new: "", confirm: "", securityAnswer: "" });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const res = await updateProfileAPI(profileData);
            if (res.data.success) {
                toast.success("Professional details updated!");
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const isDoctor = user?.role === 'doctor';

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in-up">

            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Account Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage your profile preferences and security.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Left Column: Profile + Theme */}
                <div className="md:col-span-1 space-y-8">

                    {/* Profile Summary Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 relative overflow-hidden text-center group">
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-indigo-600"></div>

                        <div className="relative z-10 px-6 pb-8 pt-12">
                            <div className="relative w-28 h-28 mx-auto mb-4">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-4xl font-black text-blue-600 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                                    {user?.photo ? (
                                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Photo Upload Overlay - ONLY FOR DOCTORS */}
                                {isDoctor && (
                                    <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                        {photoLoading ? <Loader className="animate-spin w-6 h-6" /> : (
                                            <div className="flex flex-col items-center">
                                                <Camera className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] font-bold uppercase">Change</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpdate} disabled={photoLoading} />
                                    </label>
                                )}
                            </div>

                            <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-1">{user?.name}</h3>
                            <span className="inline-block px-4 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase rounded-full tracking-wider border border-slate-200 dark:border-slate-600">
                                {user?.role}
                            </span>

                            <div className="text-left space-y-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="p-2 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-500">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mobile Number</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.mobile || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="p-2 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-500">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System ID</p>
                                        <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{user?._id?.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Settings Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                            <Laptop className="w-5 h-5 text-blue-500" /> Appearance
                        </h3>

                        <div className="space-y-3">
                            {[
                                { id: 'light', label: 'Light Mode', icon: Sun },
                                { id: 'dark', label: 'Dark Mode', icon: Moon },
                                { id: 'system', label: 'System Default', icon: Laptop }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTheme(mode.id)}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all font-medium ${theme === mode.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <mode.icon className="w-5 h-5" />
                                        <span>{mode.label}</span>
                                    </div>
                                    {theme === mode.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Change Password Form */}
                <div className="md:col-span-2 space-y-8">

                    {/* Professional Profile Settings (Doctors Only) */}
                    {isDoctor && (
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2 text-xl border-b border-slate-100 dark:border-slate-700 pb-4">
                                <Stethoscope className="w-6 h-6 text-emerald-500" /> Professional Details
                            </h3>
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Consultation Fee */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Consultation Fee (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 dark:text-white"
                                            value={profileData.consultationFee}
                                            onChange={e => setProfileData({ ...profileData, consultationFee: e.target.value })}
                                            placeholder="500"
                                        />
                                    </div>
                                    {/* Specialization */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Specialization</label>
                                        <div className="relative">
                                            <Award className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                                                value={profileData.specialization}
                                                onChange={e => setProfileData({ ...profileData, specialization: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {/* Qualification */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Qualification</label>
                                        <div className="relative">
                                            <Award className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                                                value={profileData.qualification}
                                                onChange={e => setProfileData({ ...profileData, qualification: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {/* Experience */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Experience (Years)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                                                value={profileData.experience}
                                                onChange={e => setProfileData({ ...profileData, experience: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {/* Hospital Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Clinic / Hospital Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                                                value={profileData.hospitalName}
                                                onChange={e => setProfileData({ ...profileData, hospitalName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="px-8 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {profileLoading ? <Loader className="animate-spin w-5 h-5" /> : "Save Profile Details"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2 text-xl border-b border-slate-100 dark:border-slate-700 pb-4">
                            <Lock className="w-6 h-6 text-blue-500" /> Security Settings
                        </h3>

                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-lg">

                            {/* Security Question Section */}
                            {user?.securityQuestion && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-8">
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4" /> Security Verification
                                    </p>
                                    <p className="text-slate-900 dark:text-white font-bold text-lg mb-4">"{user.securityQuestion}"</p>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Type your answer here..."
                                        className="w-full p-3 border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium placeholder-slate-400"
                                        value={passwords.securityAnswer}
                                        onChange={e => setPasswords({ ...passwords, securityAnswer: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Current Password</label>
                                <div className="relative group">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        required
                                        className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                        value={passwords.current}
                                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">New Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader className="animate-spin w-5 h-5" /> : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}