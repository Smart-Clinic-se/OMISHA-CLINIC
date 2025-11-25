import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  User, Phone, Lock, Loader2, Stethoscope, Clipboard, ShieldCheck, MapPin, Calendar, Droplet, HelpCircle, CheckCircle, X, Eye, EyeOff
} from "lucide-react";

export default function AuthPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    loginInput: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    address: "",
    bloodGroup: "",
    securityQuestion: "",
    securityAnswer: ""
  });

  const canRegister = role === 'patient';

  const getTheme = () => {
    switch (role) {
      case 'doctor': return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-600',
        hover: 'hover:bg-emerald-700',
        ring: 'focus:ring-emerald-500',
        gradient: 'from-emerald-900 to-teal-900',
        icon: <Stethoscope className="w-8 h-8 text-white" />,
        redirect: '/app/doctor/dashboard'
      };
      case 'staff': return {
        color: 'text-purple-400',
        bg: 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        ring: 'focus:ring-purple-500',
        gradient: 'from-purple-900 to-indigo-900',
        icon: <Clipboard className="w-8 h-8 text-white" />,
        redirect: '/app/staff/queue'
      };
      case 'admin': return {
        color: 'text-slate-400',
        bg: 'bg-slate-700',
        hover: 'hover:bg-slate-600',
        ring: 'focus:ring-slate-500',
        gradient: 'from-slate-800 to-black',
        icon: <ShieldCheck className="w-8 h-8 text-white" />,
        redirect: '/app/admin/doctors'
      };
      default: return {
        color: 'text-blue-400',
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
    // Auto-switch to Login view and pre-fill username
    setIsLogin(true);
    setFormData(prev => ({ ...prev, loginInput: createdCredentials?.username || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        // REGISTER VALIDATION
        if (formData.password !== formData.confirmPassword) {
          setLoading(false);
          return setError("Passwords do not match");
        }
        if (!formData.bloodGroup) {
          setLoading(false);
          return setError("Please select a Blood Group");
        }
        if (!formData.securityQuestion || !formData.securityAnswer) {
          setLoading(false);
          return setError("Security Question & Answer are required");
        }

        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobile: formData.mobile,
          password: formData.password,
          age: formData.age,
          gender: formData.gender,
          address: formData.address,
          bloodGroup: formData.bloodGroup,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer,
          role: 'patient'
        };

        const res = await register(payload);

        if (res.success) {
          // Show Success Popup
          setCreatedCredentials(res.credentials);
          setShowSuccessModal(true);

          // Clear form data
          setFormData({
            firstName: "", lastName: "", loginInput: "", mobile: "",
            password: "", confirmPassword: "", age: "", gender: "", address: "", bloodGroup: "",
            securityQuestion: "", securityAnswer: ""
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

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-fade-in-up relative">

      {/* === SUCCESS POPUP MODAL === */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-emerald-500/30 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
            <p className="text-slate-400 text-sm mb-6">Your account has been created.</p>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-left mb-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Your Login Username</p>
              <p className="text-xl font-mono font-black text-blue-400">{createdCredentials?.username}</p>
              <p className="text-[10px] text-slate-500 mt-2">(You can also login with your Mobile Number)</p>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg transition-transform active:scale-95"
            >
              Proceed to Login
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-slate-800 w-full max-w-md">

        <div className={`relative p-10 text-center bg-gradient-to-r ${theme.gradient}`}>
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-4 shadow-inner border border-white/10">
              {theme.icon}
            </div>
            <h2 className="text-3xl font-bold text-white capitalize tracking-wide">
              {role} Portal
            </h2>
            <p className="text-slate-300 mt-2 font-medium">
              {isLogin ? "Login to your account" : "Create Patient Account"}
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          {error && <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded-r-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* === LOGIN FORM === */}
            {isLogin && (
              <>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    name="loginInput"
                    type="text"
                    required
                    placeholder="Username OR Mobile Number"
                    value={formData.loginInput}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl outline-none transition-all text-white placeholder-slate-500 ${theme.ring} focus:ring-2 focus:bg-slate-900`}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-4 bg-slate-800 border border-slate-700 rounded-xl outline-none transition-all text-white placeholder-slate-500 ${theme.ring} focus:ring-2 focus:bg-slate-900`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* === HIDE FOR ADMIN === */}
                {role !== 'admin' && (
                  <div className="text-right">
                    <Link to={`/auth/forgot-password?role=${role}`} className={`text-sm font-bold hover:underline ${theme.color}`}>
                      Forgot Password?
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* === REGISTRATION FORM === */}
            {!isLogin && canRegister && (
              <div className="space-y-4">
                {/* Split Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                    <input name="firstName" required placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500" />
                  </div>
                  <div className="relative">
                    <input name="lastName" required placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full pl-4 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500" />
                  </div>
                </div>

                <div className="relative">
                  <Phone className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                  <input name="mobile" type="tel" required placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Calendar className="absolute top-4 left-3 w-4 h-4 text-slate-500" />
                    <input name="age" type="number" required placeholder="Age" value={formData.age} onChange={handleChange} className="w-full pl-9 pr-2 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-sm text-white placeholder-slate-500" />
                  </div>
                  <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full px-2 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-sm text-white placeholder-slate-500">
                    <option value="" className="bg-slate-900">Sex</option><option className="bg-slate-900">Male</option><option className="bg-slate-900">Female</option><option className="bg-slate-900">Other</option>
                  </select>
                  <div className="relative">
                    <Droplet className="absolute top-4 left-2 w-4 h-4 text-red-400" />
                    <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange} className="w-full pl-7 pr-2 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-sm text-white placeholder-slate-500">
                      <option value="" className="bg-slate-900">Grp</option><option value="A+" className="bg-slate-900">A+</option><option value="A-" className="bg-slate-900">A-</option><option value="B+" className="bg-slate-900">B+</option><option value="B-" className="bg-slate-900">B-</option><option value="O+" className="bg-slate-900">O+</option><option value="O-" className="bg-slate-900">O-</option><option value="AB+" className="bg-slate-900">AB+</option><option value="AB-" className="bg-slate-900">AB-</option><option value="Unknown" className="bg-slate-900">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <MapPin className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                  <input name="address" type="text" placeholder="Address (Optional)" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-white placeholder-slate-500" />
                </div>

                {/* Security Question */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Security Question (For Recovery)
                  </p>
                  <div className="relative">
                    <HelpCircle className="absolute top-3.5 left-4 w-5 h-5 text-slate-500" />
                    <select name="securityQuestion" required value={formData.securityQuestion} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-sm text-white placeholder-slate-500">
                      <option value="" className="bg-slate-900">Select a Question...</option>
                      <option value="What is your first pet's name?" className="bg-slate-900">What is your first pet's name?</option>
                      <option value="What is your mother's maiden name?" className="bg-slate-900">What is your mother's maiden name?</option>
                      <option value="What city were you born in?" className="bg-slate-900">What city were you born in?</option>
                      <option value="What is your favorite color?" className="bg-slate-900">What is your favorite color?</option>
                    </select>
                  </div>
                  <input name="securityAnswer" type="text" required placeholder="Your Answer" value={formData.securityAnswer} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-sm text-white placeholder-slate-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Lock className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm Pwd"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-xl flex justify-center items-center ${theme.bg} ${theme.hover}`}
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (isLogin ? "Login" : "Create Account")}
            </button>
          </form>

          {canRegister && (
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    // setSuccessMsg(""); // handled by modal now
                    setFormData({
                      firstName: "", lastName: "", loginInput: "", mobile: "",
                      password: "", confirmPassword: "", age: "", gender: "", address: "", bloodGroup: "",
                      securityQuestion: "", securityAnswer: ""
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
  );
}