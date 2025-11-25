import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getSecurityQuestionAPI, resetPasswordAPI } from "../api";
import { ArrowLeft, ShieldCheck, Key, User, HelpCircle, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function PageForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "patient"; // Default to patient if not provided
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
      // Redirect to login after short delay
      setTimeout(() => navigate(`/auth/${role}`, { replace: true }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect Answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Account Recovery</h2>
          <p className="text-slate-400 text-sm mt-2">Reset your password securely</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleFetchQuestion} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Enter your ID</label>
                <div className="relative">
                  <User className="absolute top-3.5 left-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Mobile or Username"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Find Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5 animate-slide-in-right">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase mb-1 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Security Question
                </p>
                <p className="text-blue-900 font-bold text-lg">"{question}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Answer</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type answer here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">New Password</label>
                <div className="relative">
                  <Key className="absolute top-3.5 left-4 w-5 h-5 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Set new password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-lg shadow-emerald-200"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Reset Password <CheckCircle className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to={`/auth/${role}`} replace className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}