import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSecuritySetupAPI } from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";
import { ShieldCheck, Lock, HelpCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function PageAccountSecuritySetup() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        securityQuestion: "",
        securityAnswer: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.securityQuestion || !formData.securityAnswer || !formData.newPassword) {
            toast.error("All fields are required.");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                userId: user._id,
                newPassword: formData.newPassword,
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer
            };

            await completeSecuritySetupAPI(payload);

            toast.success("Security setup completed! Please login again.");

            // Logout to force re-login with new credentials
            logout();
            navigate("/");

        } catch (err) {
            console.error("Setup failed", err);
            const backendError = err.response?.data?.error;
            const message = err.response?.data?.message || "Failed to complete setup.";
            toast.error(backendError ? `${message}: ${backendError}` : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900/50 backdrop-blur-md max-w-lg w-full rounded-2xl shadow-xl shadow-black/20 border border-slate-800 overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="bg-slate-900/80 p-8 text-center border-b border-slate-800">
                    <div className="mx-auto bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-blue-500/20">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Account Security Setup</h1>
                    <p className="text-slate-400">
                        Welcome, {user?.name}! For your security, please set up your account recovery details and change your password.
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Security Question */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-blue-500" /> Security Question
                            </label>
                            <select
                                required
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                value={formData.securityQuestion}
                                onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}
                            >
                                <option value="" className="bg-slate-900">Select a question...</option>
                                <option value="What is your pet's name?" className="bg-slate-900">What is your pet's name?</option>
                                <option value="What is your mother's maiden name?" className="bg-slate-900">What is your mother's maiden name?</option>
                                <option value="What was the name of your first school?" className="bg-slate-900">What was the name of your first school?</option>
                                <option value="What is your favorite food?" className="bg-slate-900">What is your favorite food?</option>
                                <option value="What city were you born in?" className="bg-slate-900">What city were you born in?</option>
                                <option value="What is your favorite color?" className="bg-slate-900">What is your favorite color?</option>
                            </select>
                        </div>

                        {/* Security Answer */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Answer</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                placeholder="Your answer..."
                                value={formData.securityAnswer}
                                onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })}
                            />
                        </div>

                        <hr className="border-slate-800" />

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-blue-500" /> New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    className="w-full p-3 pr-10 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                    placeholder="Min 6 characters"
                                    value={formData.newPassword}
                                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="w-full p-3 pr-10 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-white placeholder-slate-500"
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition transform active:scale-95 flex items-center justify-center gap-2 shadow-blue-900/20"
                        >
                            {loading ? "Saving..." : "Save & Continue"}
                            {!loading && <CheckCircle className="w-5 h-5" />}
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}
