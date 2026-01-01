import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getSecurityQuestionAPI, resetPasswordAPI } from "../api";
import { ArrowLeft, ShieldCheck, Key, User, HelpCircle, Loader2, CheckCircle, Eye, EyeOff, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useEnterNavigation } from "../hooks/useEnterNavigation";

export default function PageForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "patient";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const formRef = useEnterNavigation();

  // Form State
  const [loginInput, setLoginInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Step 1: Find User & Get Question
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    if (!loginInput) return toast.error("Please enter your Login ID");

    setLoading(true);
    try {
      const res = await getSecurityQuestionAPI({ loginInput });
      setQuestion(res.data.question);
      setStep(2);
      toast.success("User found!");
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Answer & Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    if (!answer || !newPassword) return toast.error("All fields required");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 chars");

    setLoading(true);
    try {
      const res = await resetPasswordAPI({
        loginInput,
        securityAnswer: answer,
        newPassword
      });

      toast.success(res.data.message);
      setTimeout(() => navigate(`/auth/${role}`, { replace: true }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect Answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIXED: Full Screen Centering Wrapper
    <div className="fixed inset-0 z-[100] w-full h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-y-auto transition-colors duration-300">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-50 font-bold">
        <Home className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in-up relative z-10">

        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 text-center border-b border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-600 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Account Recovery</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Reset your password securely</p>
        </div>

        <div className="p-6 sm:p-8">
          {step === 1 ? (
            <form ref={formRef} onSubmit={handleFetchQuestion} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Enter your ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Mobile or Username"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Find Account"}
              </button>
            </form>
          ) : (
            <form ref={formRef} onSubmit={handleReset} className="space-y-6 animate-slide-in-right">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Security Question
                </p>
                <p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">"{question}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Your Answer</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type answer here..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Set new password"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Reset Password <CheckCircle className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-700">
            <Link to={`/auth/${role}`} replace className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}