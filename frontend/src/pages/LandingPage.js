import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  User,
  Stethoscope,
  Clipboard,
  Lock,
  HeartPulse,
  ArrowRight,
  Sun,
  Moon,
  X,
  MapPin,
  GraduationCap,
  Calendar
} from "lucide-react";
import { getDoctorsAPI, listenToDoctorStatus } from "../api";
import DoctorCard from "../components/DoctorCard";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { theme, setTheme, isDarkMode } = useTheme();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await getDoctorsAPI();
        setDoctors(res.data);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDoctors();

    // Real-time Status Update
    const cleanup = listenToDoctorStatus((payload) => {
      setDoctors(prev => prev.map(doc => {
        if (doc._id === payload.doctorId) {
          return { ...doc, availabilityStatus: payload.status, breakUntil: payload.breakUntil };
        }
        return doc;
      }));
    });
    return cleanup;
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Use the resolved visual state for rendering logic
  const isDark = isDarkMode;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-x-hidden text-slate-900 dark:text-white selection:bg-rose-500 selection:text-white transition-colors duration-300 relative">

      {/* --- GLOBAL BACKGROUND ATMOSPHERE --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Professional Medical Gradient: Blue -> Cyan -> White */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-cyan-50 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-950"></div>
        {/* Increased opacity from 20 to 30 */}
        <div className="absolute inset-0 opacity-30 dark:opacity-30 animate-grid-flow"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)'
              : 'radial-gradient(#64748b 1px, transparent 1px)', // Darker grid dots for better visibility
            backgroundSize: isDark ? '40px 40px' : '24px 24px',
            backgroundPosition: 'center center',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}>
        </div>
        {!isDark && (
          <>
            {/* Top Right: Professional Blue/Cyan Blob */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-[100px] opacity-100 -translate-y-1/2 translate-x-1/3"></div>
            {/* Bottom Left: Medical Teal/Emerald Blob */}
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-teal-300/20 to-emerald-200/20 rounded-full blur-[100px] opacity-100 translate-y-1/3 -translate-x-1/4"></div>
          </>
        )}
        {isDark && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        )}
      </div>

      {/* === HERO SECTION === */}
      {/* Increased padding-bottom on mobile to accommodate wave */}
      <header className="relative z-10 pt-12 pb-24 md:pb-24 px-4 text-center overflow-hidden">

        {/* --- THEME TOGGLE --- */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <button
            onClick={toggleTheme}
            className="group relative inline-flex h-9 w-16 md:h-10 md:w-20 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 shadow-lg transition-all hover:scale-105 active:scale-95"
            title="Switch Mode"
          >
            <span className="absolute left-2 md:left-2.5 text-slate-400 dark:text-slate-500"><Sun className="w-3 h-3 md:w-4 md:h-4" /></span>
            <span className="absolute right-2 md:right-2.5 text-slate-400 dark:text-slate-500"><Moon className="w-3 h-3 md:w-4 md:h-4" /></span>
            <span className={`absolute left-1 h-6 w-6 md:h-7 md:w-7 rounded-full bg-slate-100 dark:bg-slate-700 shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-7 md:translate-x-10' : 'translate-x-0'}`}>
              {isDark ? <Moon className="w-3 h-3 md:w-4 md:h-4 text-blue-500 fill-blue-500" /> : <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-500" />}
            </span>
          </button>
        </div>

        {/* --- HERO CONTENT --- */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center mb-12">
          <div className="mb-8 inline-flex items-center justify-center p-4 bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-rose-900/20 ring-1 ring-slate-100 dark:ring-slate-700 backdrop-blur-md">
            <HeartPulse className="w-12 h-12 text-rose-500 dark:text-rose-500 drop-shadow-sm dark:drop-shadow-neon" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-none leading-tight md:leading-[1.1]">
            OMISHA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">CLINIC</span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mb-8 leading-relaxed" />

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center items-center">
            <Link to="/tv" className="group relative inline-flex items-center justify-center w-48 py-2.5 bg-gradient-to-b from-rose-500 to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-200 dark:shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 hover:scale-[1.03] transition-all duration-300 ring-offset-2 focus:ring-2 ring-rose-500 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              Live Queue TV
            </Link>

            <a href="#portals" className="hidden sm:inline-flex items-center justify-center w-48 py-2.5 
              bg-white text-slate-700 border border-slate-200 
              dark:bg-slate-800/50 dark:text-white dark:border-slate-600 
              font-bold text-sm rounded-xl 
              hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600
              dark:hover:bg-slate-800 dark:hover:border-white dark:hover:text-white
              transition-all duration-300 shadow-md hover:shadow-lg">
              Access Portals
            </a>
          </div>
        </div>

        {/* --- NEON WAVE SVG --- */}
        {/* Positioned at bottom, but tall enough to reach up into the button gap */}
        <div className="absolute bottom-0 left-0 w-full h-32 z-0 pointer-events-none opacity-60 dark:opacity-100 flex justify-center items-end pb-0">
          <NeonHeartbeat isDark={isDark} />
        </div>
      </header>

      {/* --- 1. ACCESS PORTALS --- */}
      {/* Reduced padding */}
      <main id="portals" className="relative z-20 px-4 py-6 bg-transparent dark:bg-transparent">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Select Your Role</h2>
          <div className="h-1.5 w-24 bg-blue-600 mx-auto mt-6 rounded-full shadow-xl shadow-blue-500/30"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
          <VibrantCard
            to="/auth/patient"
            title="Patient"
            desc="Book Appointments"
            icon={<User className="w-8 h-8" />}
            isDark={isDark}
            lightClass="bg-blue-50/80 backdrop-blur-sm border-2 border-blue-100 text-blue-900 shadow-lg shadow-blue-100 hover:border-blue-300 hover:shadow-blue-200"
            iconBgLight="bg-white text-blue-600 shadow-sm ring-1 ring-blue-100"
            darkClass="bg-slate-800 border border-slate-700 text-white shadow-xl shadow-black/20 hover:border-blue-500 hover:shadow-blue-900/20"
            iconBgDark="bg-slate-900 text-blue-400 border border-slate-700"
            glow="group-hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
          />
          <VibrantCard
            to="/auth/doctor"
            title="Doctor"
            desc="Manage Patients"
            icon={<Stethoscope className="w-8 h-8" />}
            isDark={isDark}
            lightClass="bg-emerald-50/80 backdrop-blur-sm border-2 border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100 hover:border-emerald-300 hover:shadow-emerald-200"
            iconBgLight="bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100"
            darkClass="bg-slate-800 border border-slate-700 text-white shadow-xl shadow-black/20 hover:border-emerald-500 hover:shadow-emerald-900/20"
            iconBgDark="bg-slate-900 text-emerald-400 border border-slate-700"
            glow="group-hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
          />
          <VibrantCard
            to="/auth/staff"
            title="Staff"
            desc="Front Desk Ops"
            icon={<Clipboard className="w-8 h-8" />}
            isDark={isDark}
            lightClass="bg-violet-50/80 backdrop-blur-sm border-2 border-violet-100 text-violet-900 shadow-lg shadow-violet-100 hover:border-violet-300 hover:shadow-violet-200"
            iconBgLight="bg-white text-violet-600 shadow-sm ring-1 ring-violet-100"
            darkClass="bg-slate-800 border border-slate-700 text-white shadow-xl shadow-black/20 hover:border-violet-500 hover:shadow-violet-900/20"
            iconBgDark="bg-slate-900 text-violet-400 border border-slate-700"
            glow="group-hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
          />
          <VibrantCard
            to="/auth/admin"
            title="Admin"
            desc="System Settings"
            icon={<Lock className="w-8 h-8" />}
            isDark={isDark}
            lightClass="bg-slate-50/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 shadow-lg shadow-slate-200 hover:border-slate-400 hover:shadow-slate-300"
            iconBgLight="bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
            darkClass="bg-slate-800 border border-slate-700 text-white shadow-xl shadow-black/20 hover:border-slate-500 hover:shadow-slate-600/20"
            iconBgDark="bg-slate-900 text-slate-400 border border-slate-700"
            glow="group-hover:shadow-[0_0_20px_-5px_rgba(148,163,184,0.5)]"
          />
        </div>
      </main>

      {/* --- 2. MEDICAL BOARD --- */}
      {/* Reduced padding */}
      <section className="relative z-20 py-6 px-4 bg-transparent dark:bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Medical Board</h2>
            <div className="h-1 w-24 bg-rose-500 mx-auto rounded-full shadow-lg shadow-rose-500/30"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto text-lg">
              Click on a specialist to view their schedule and details.
            </p>
          </div>

          {doctors.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-5">
              {doctors.map(doc => (
                <div
                  key={doc._id}
                  onClick={() => setSelectedDoctor(doc)}
                  className="cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:scale-105 h-full"
                >
                  <DoctorCard doctor={doc} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-secondary py-16 bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-dashed max-w-2xl mx-auto shadow-sm">
              <p className="text-slate-400 dark:text-slate-500 text-lg">Medical Board information is being updated.</p>
            </div>
          )}
        </div>
      </section>

      {/* --- DOCTOR DETAILS MODAL --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDoctor(null)}
          ></div>

          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-400 relative">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-8 -mt-12 relative">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border-4 border-white dark:border-slate-800 flex items-center justify-center mb-4 overflow-hidden">
                {selectedDoctor.photo ? (
                  <img src={selectedDoctor.photo} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                )}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {selectedDoctor.name || selectedDoctor.fullName || "Doctor"}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 inline-block px-3 py-1 rounded-full text-sm">
                  {selectedDoctor.specialization || "General Physician"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <GraduationCap className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Experience</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedDoctor.experience || "5+"} Years</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <MapPin className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Hospital</p>
                  <p className="font-bold text-slate-800 dark:text-white truncate px-2">{selectedDoctor.hospitalName || "Omisha"}</p>
                </div>
              </div>

              <button
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={() => window.location.href = '/auth/patient'}
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="relative z-20 bg-white/80 backdrop-blur-md dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <HeartPulse className="w-6 h-6 text-rose-600 dark:text-rose-500" />
            </div>
            <span className="font-bold tracking-wide text-slate-900 dark:text-white text-lg">OMISHA CLINIC</span>
          </div>
          <div className="text-sm font-medium text-center md:text-right">&copy; 2025 Omisha Healthcare.</div>
        </div>
      </footer>
    </div>
  );
}

// --- INTELLIGENT CARD COMPONENT ---
function VibrantCard({ to, title, desc, icon, isDark, lightClass, darkClass, iconBgLight, iconBgDark, glow }) {
  const baseClasses = isDark ? darkClass : lightClass;
  const iconBg = isDark ? iconBgDark : iconBgLight;

  return (
    <Link
      to={to}
      className={`
        group relative overflow-hidden rounded-2xl p-5
        transition-all duration-300 ease-out 
        hover:-translate-y-1 hover:scale-[1.01]
        ${baseClasses}
        ${isDark ? glow : ''} 
      `}
    >
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150 ${isDark ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-white/60 opacity-50'}`}></div>

      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-start h-full">
        <div className={`mb-6 p-4 backdrop-blur-md rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconBg}`}>
          {icon}
        </div>

        <h3 className="text-lg font-bold mb-1 tracking-tight">{title}</h3>
        <p className={`text-sm font-bold mb-10 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500/80'}`}>{desc}</p>

        <div className={`mt-auto flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg backdrop-blur-sm transition-all ${isDark ? 'bg-slate-900 border border-slate-700 text-white group-hover:bg-slate-800' : 'bg-white text-slate-800 shadow-md group-hover:shadow-lg'}`}>
          <span>Login</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

function NeonHeartbeat({ isDark }) {
  const strokeColor = isDark ? 'stroke-rose-500' : 'stroke-rose-400';

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent z-10"></div>

      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={`w-full h-full ${strokeColor} drop-shadow-neon animate-scan opacity-100`}
        style={{
          maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 50%, transparent 100%)',
          maskSize: '50% 100%',
          maskRepeat: 'no-repeat',
        }}
      >
        <path
          d="M0,60 L200,60 L220,60 L230,50 L240,70 L250,60 L260,60 L270,10 L280,110 L290,60 L300,60 L310,60 L320,45 L340,60 L550,60 
             L570,60 L580,50 L590,70 L600,10 L610,110 L620,60 L630,60 L640,60 L650,60 L660,60 L670,45 L690,60 L900,60
             L920,60 L930,50 L940,70 L950,60 L960,60 L970,10 L980,110 L990,60 L1000,60 L1010,60 L1020,45 L1040,60 L1200,60"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}