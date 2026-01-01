import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  User, Phone, Lock, Loader2, Stethoscope, Clipboard, ShieldCheck, MapPin, Calendar, Droplet, HelpCircle, CheckCircle, X, Eye, EyeOff, Home, Briefcase
} from "lucide-react";
// DatePicker CSS restored
import * as RDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "../components/ui/Select";
import { useEnterNavigation } from "../hooks/useEnterNavigation";

const DatePicker = RDatePicker && RDatePicker.default ? RDatePicker.default : RDatePicker;

export default function AuthPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const formRef = useEnterNavigation();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    loginInput: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    dob: null,
    gender: "",
    address: "",
    bloodGroup: "",
    securityQuestion: "",
    securityAnswer: "",
    occupation: ""
  });

  const canRegister = role === 'patient';

  const getTheme = () => {
    switch (role) {
      case 'doctor': return {
        color: 'text-emerald-500',
        bg: 'bg-emerald-600',
        hover: 'hover:bg-emerald-700',
        ring: 'focus:ring-emerald-500',
        gradient: 'from-emerald-900 to-teal-900',
        icon: <Stethoscope className="w-8 h-8 text-white" />,
        redirect: '/app/doctor/dashboard'
      };
      case 'staff': return {
        color: 'text-purple-500',
        bg: 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        ring: 'focus:ring-purple-500',
        gradient: 'from-purple-900 to-indigo-900',
        icon: <Clipboard className="w-8 h-8 text-white" />,
        redirect: '/app/staff/queue'
      };
      case 'admin': return {
        color: 'text-slate-500',
        bg: 'bg-slate-700',
        hover: 'hover:bg-slate-600',
        ring: 'focus:ring-slate-500',
        gradient: 'from-slate-800 to-black',
        icon: <ShieldCheck className="w-8 h-8 text-white" />,
        redirect: '/app/admin/doctors'
      };
      default: return {
        color: 'text-blue-500',
        bg: 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        ring: 'focus:ring-blue-500',
        gradient: 'from-blue-900 to-cyan-900',
        icon: <User className="w-8 h-8 text-white" />,
        redirect: '/app/patient/queue'
      };
    }
  };

  const theme = getTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate(theme.redirect);
  }, [navigate, theme.redirect]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setIsLogin(true);
    setFormData(prev => ({ ...prev, loginInput: createdCredentials?.username || "" }));
  };

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

  const strength = isLogin ? 0 : getPasswordStrength(formData.password);
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthLabels = ["Enter Password", "Weak", "Fair", "Good", "Strong"];

  // --- VALIDATION LOGIC ---
  const isLoginValid =
    formData.loginInput?.trim().length > 0 &&
    formData.password?.trim().length > 0;

  const isRegisterValid =
    formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.mobile?.trim() &&
    formData.dob &&
    formData.gender &&
    formData.bloodGroup &&
    formData.securityQuestion &&
    formData.securityAnswer?.trim() &&
    formData.password?.trim() &&
    formData.confirmPassword?.trim();

  // Combine logic: If loading, or form is invalid, button is disabled
  const isFormValid = isLogin ? isLoginValid : isRegisterValid;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return; // Double check

    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(formData.loginInput, formData.password, role);
        if (res.success) {
          const from = location.state?.from?.pathname || theme.redirect;
          navigate(from, { replace: true });
        } else {
          setError(res.message);
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setLoading(false);
          return setError("Passwords do not match");
        }

        const payload = {
          ...formData,
          role: 'patient',
          // ModernDatePicker returns a Date object, so we format it
          dob: formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ""
        };
        const res = await register(payload);

        if (res.success) {
          setCreatedCredentials(res.credentials);
          setShowSuccessModal(true);
          setFormData({
            firstName: "", lastName: "", loginInput: "", mobile: "",
            password: "", confirmPassword: "", dob: null, gender: "", address: "", bloodGroup: "",
            securityQuestion: "", securityAnswer: "",
            securityQuestion: "", securityAnswer: "",
            occupation: ""
          });
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- STYLE CLASSES ---
  const inputClass = `w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all 
    bg-slate-50 dark:bg-slate-900 
    border border-slate-200 dark:border-slate-700 
    text-slate-900 dark:text-white 
    placeholder-slate-400 
    focus:bg-white dark:focus:bg-slate-800 
    focus:ring-2 focus:border-transparent ${theme.ring}
    shadow-sm text-sm sm:text-base`;

  return (
    <>
      {/* === SUCCESS POPUP MODAL === */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-emerald-500/30 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Your account has been created.</p>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Login Username</p>
              <p className="text-xl font-mono font-black text-blue-500 allow-select">{createdCredentials?.username}</p>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-transform active:scale-95"
            >
              Proceed to Login
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[100] w-full h-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 overflow-y-auto animate-fade-in-up">

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <Link to="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-50 font-bold bg-white/50 dark:bg-black/20 backdrop-blur-sm p-2 rounded-lg">
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>



        {/* MAIN CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-black/50 overflow-hidden border border-slate-100 dark:border-slate-700 w-full max-w-md relative z-10 my-auto">

          {/* Dynamic Header */}
          <div className={`relative p-5 sm:p-8 text-center bg-gradient-to-r ${theme.gradient} dark:${theme.gradient}`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md mb-4 shadow-lg border border-white/20">
                {theme.icon}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize tracking-tight drop-shadow-sm">
                {role} Portal
              </h2>
              <p className="text-blue-50 mt-2 font-medium opacity-90 text-sm sm:text-base">
                {isLogin ? "Login to your account" : "Create Patient Account"}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 text-sm rounded-r-lg font-medium flex items-center gap-2">
                <X className="w-4 h-4" /> {error}
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              {/* === LOGIN FORM === */}
              {isLogin && (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      name="loginInput"
                      type="text"
                      required
                      placeholder="Username OR Mobile Number"
                      value={formData.loginInput}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {role !== 'admin' && (
                    <div className="text-right">
                      <Link to={`/auth/forgot-password?role=${role}`} className={`text-sm font-bold hover:underline ${theme.color} block py-2`}>
                        Forgot Password?
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* === REGISTRATION FORM === */}
              {!isLogin && canRegister && (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 p-1 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input name="firstName" required placeholder="First Name" value={formData.firstName} onChange={handleChange} className={`${inputClass} pl-4`} />
                    </div>
                    <div className="relative">
                      <input name="lastName" required placeholder="Last Name" value={formData.lastName} onChange={handleChange} className={`${inputClass} pl-4`} />
                    </div>
                  </div>

                  <div className="relative">
                    <Phone className="absolute top-4 left-4 w-5 h-5 text-slate-400" />
                    <input name="mobile" type="tel" required placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* DOB Row */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Calendar className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <DatePicker
                      selected={formData.dob ? new Date(formData.dob) : null}
                      onChange={(date) => setFormData({ ...formData, dob: date })}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="DOB"
                      className={`${inputClass} pl-12`}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      maxDate={new Date()}
                      required
                    />
                  </div>

                  {/* Gender & Blood Group Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      name="gender"
                      placeholder="Sex"
                      value={formData.gender}
                      onChange={handleChange}
                      options={["Male", "Female", "Other"]}
                      required
                      className="w-full"
                    />
                    <Select
                      name="bloodGroup"
                      placeholder="Blood Group"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute top-4 left-4 w-5 h-5 text-slate-400" />
                    <input name="address" type="text" placeholder="Address (Optional)" value={formData.address} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* Occupation */}
                  <div className="relative">
                    <Briefcase className="absolute top-4 left-4 w-5 h-5 text-slate-400" />
                    <input
                      name="occupation"
                      type="text"
                      placeholder="Occupation (Optional)"
                      value={formData.occupation}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Recovery Question
                    </p>
                    <Select
                      name="securityQuestion"
                      label="Recovery Question"
                      placeholder="Select a Question..."
                      value={formData.securityQuestion}
                      onChange={handleChange}
                      options={[
                        "What is your first pet's name?",
                        "What is your mother's maiden name?",
                        "What was the name of your first school?",
                        "What is your favorite food?",
                        "What city were you born in?",
                        "What is your favorite color?"
                      ]}
                      required
                      className="w-full"
                    />
                    <input name="securityAnswer" type="text" required placeholder="Your Answer" value={formData.securityAnswer} onChange={handleChange} className={`${inputClass} pl-4`} />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        name="password"
                        type={showRegPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors outline-none"
                      >
                        {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Enhanced Strength Meter */}
                    {formData.password && !isLogin && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Strength</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${strengthColors[strength].replace('bg-', 'text-')}`}>
                            {strengthLabels[strength]}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-out ${strengthColors[strength]}`}
                            style={{ width: `${(strength / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON WITH DISABLE STATE */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full py-4 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 transform transition-all 
                flex justify-center items-center 
                ${theme.bg} ${theme.hover}
                ${(loading || !isFormValid) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:shadow-xl'}`}
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (isLogin ? "Login" : "Create Account")}
              </button>
            </form>

            {canRegister && (
              <div className="mt-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setFormData({
                        firstName: "", lastName: "", loginInput: "", mobile: "",
                        password: "", confirmPassword: "", dob: null, gender: "", address: "", bloodGroup: "",
                        securityQuestion: "", securityAnswer: "",
                        occupation: ""
                      });
                    }}
                    className={`ml-2 font-bold hover:underline ${theme.color}`}
                  >
                    {isLogin ? "Register Now" : "Login Here"}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}