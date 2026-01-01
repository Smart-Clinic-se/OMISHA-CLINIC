import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSecuritySetupAPI } from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";
import { ShieldCheck, Lock, HelpCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import Select from "../components/ui/Select";
import { useEnterNavigation } from "../hooks/useEnterNavigation";

export default function PageAccountSecuritySetup() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const formRef = useEnterNavigation();

    const [formData, setFormData] = useState({
        securityQuestion: "",
        securityAnswer: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // === PASSWORD STRENGTH LOGIC ===
    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 7) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getPasswordStrength(formData.newPassword);
    const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
    const strengthLabels = ["Enter Password", "Weak", "Fair", "Good", "Strong"];

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up relative z-10">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 text-center border-b border-slate-100 dark:border-slate-700">
                    <div className="mx-auto bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg border border-slate-100 dark:border-slate-700">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white mb-1">Account Security Setup</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium px-4">
                        Welcome, <span className="font-bold text-slate-800 dark:text-white">{user?.name}</span>! Please set up your recovery details.
                    </p>
                </div>

                {/* Form */}
                <div className="p-5 sm:p-6">
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

                        {/* Security Question */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-2">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Security Question
                            </label>
                            <Select
                                name="securityQuestion"
                                placeholder="Select a question..."
                                value={formData.securityQuestion}
                                onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}
                                options={[
                                    "What is your first pet's name?",
                                    "What is your mother's maiden name?",
                                    "What was the name of your first school?",
                                    "What is your favorite food?",
                                    "What city were you born in?",
                                    "What is your favorite color?"
                                ]}
                                required
                                className="w-full text-sm"
                            />
                        </div>

                        {/* Security Answer */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Answer</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white font-medium placeholder-slate-400 text-sm"
                                placeholder="Your answer..."
                                value={formData.securityAnswer}
                                onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })}
                            />
                        </div>

                        <hr className="border-slate-100 dark:border-slate-700 my-4" />

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-blue-500" /> New Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white font-medium placeholder-slate-400 text-sm"
                                    placeholder="Min 6 characters"
                                    value={formData.newPassword}
                                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength Meter */}
                            {formData.newPassword && (
                                <div className="mt-2">
                                    <div className="flex gap-1 h-1 mb-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-full flex-1 rounded-full transition-colors duration-300 
                                                ${strength >= level ? strengthColors[strength] : "bg-slate-200 dark:bg-slate-700"}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <p className={`text-[10px] font-bold text-right ${strength === 4 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {strengthLabels[strength]}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Confirm Password</label>
                            <div className="relative group">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white font-medium placeholder-slate-400 text-sm"
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition transform active:scale-95 flex items-center justify-center gap-2 shadow-emerald-500/20 mt-2 text-sm"
                        >
                            {loading ? "Saving..." : "Save & Continue"}
                            {!loading && <CheckCircle className="w-4 h-4" />}
                        </button>

                    </form>
                </div>

            </div >
        </div >
    );
}