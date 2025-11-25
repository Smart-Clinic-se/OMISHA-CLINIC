import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { changePasswordAPI } from "../api";
import toast from "react-hot-toast";
import { User, Shield, Lock, HelpCircle, Eye, EyeOff } from "lucide-react";

export default function PageSettings() {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "", securityAnswer: "" });
    const [loading, setLoading] = useState(false);

    // Password Visibility State
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    return (
        <div className="max-w-5xl mx-auto">

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400">Manage your profile and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Profile Summary Card */}
                <div className="md:col-span-1">
                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-xl border border-slate-800 shadow-xl shadow-black/20 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-900/20 to-transparent z-0"></div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-inner border border-blue-500/20">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-xl text-white">{user?.name}</h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold uppercase rounded-full tracking-wide border border-slate-700">
                                {user?.role}
                            </span>

                            <div className="text-left space-y-4 mt-8 pt-6 border-t border-slate-800">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="text-blue-500"><User className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Mobile Number</p>
                                        <p className="text-sm font-medium text-slate-300">{user?.mobile || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="text-blue-500"><Shield className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">System ID</p>
                                        <p className="text-sm font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">{user?._id?.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Form */}
                <div className="md:col-span-2">
                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-xl border border-slate-800 shadow-xl shadow-black/20">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                            <span className="text-slate-500"><Lock className="w-5 h-5" /></span> Security Settings
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

                            {/* Security Question Section (If exists) */}
                            {user?.securityQuestion && (
                                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 mb-4">
                                    <p className="text-xs font-bold text-blue-400 uppercase mb-1 flex items-center gap-1">
                                        <HelpCircle className="w-5 h-5" /> Security Question
                                    </p>
                                    <p className="text-blue-200 font-medium mb-3">"{user.securityQuestion}"</p>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Your Answer"
                                        className="w-full p-2 border border-slate-700 rounded bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white placeholder-slate-500"
                                        value={passwords.securityAnswer}
                                        onChange={e => setPasswords({ ...passwords, securityAnswer: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        required
                                        className="w-full p-3 pr-10 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition bg-slate-800 text-white focus:bg-slate-900"
                                        value={passwords.current}
                                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        className="w-full p-3 pr-10 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition bg-slate-800 text-white focus:bg-slate-900"
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="w-full p-3 pr-10 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition bg-slate-800 text-white focus:bg-slate-900"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-lg font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}