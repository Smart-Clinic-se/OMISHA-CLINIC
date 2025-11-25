import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Clock,
  ShieldCheck,
  User,
  Stethoscope,
  Clipboard,
  Lock,
  HeartPulse,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans overflow-x-hidden text-slate-200 selection:bg-red-500 selection:text-white">
      <header className="relative pt-12 pb-32 px-4 text-center overflow-hidden">

        {/* === BACKGROUND === */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950"></div>
          <div className="absolute inset-0 opacity-10 animate-grid-flow"
            style={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              transform: 'perspective(500px) rotateX(60deg)'
            }}>
          </div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        </div>

        {/* --- CONTENT --- */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center mb-12">
          {/* Badge with Red Glow */}
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-2xl backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            <HeartPulse className="w-10 h-10 text-red-600 drop-shadow-neon" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-white drop-shadow-2xl">
            OMISHA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">CLINIC</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light mb-10 leading-relaxed">
            Advanced Healthcare Management. <br className="hidden md:block" />
            <span className="text-blue-400 font-medium">Real-time Vitals</span> & <span className="text-emerald-400 font-medium">Smart Queues</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link to="/tv" className="inline-flex items-center justify-center px-8 py-3 bg-red-600 text-white font-bold rounded-xl shadow-[0_0_25px_-5px_rgba(220,38,38,0.6)] hover:bg-red-500 hover:scale-105 transition-all duration-300 border border-red-500">
              <Activity className="w-5 h-5 mr-2 animate-pulse" />
              Live Queue TV
            </Link>
            <a href="#portals" className="inline-flex items-center justify-center px-8 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 backdrop-blur-sm">
              Access Portals
            </a>
          </div>
        </div>

        {/* --- REALISTIC ECG CANVAS --- */}
        <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 z-0 pointer-events-none select-none">
          <RealTimeEKG />
        </div>
      </header>

      {/* --- FEATURES --- */}
      <div className="relative z-20 -mt-10 px-4 mb-20">
        <div className="max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <FeatureItem icon={<Clock className="text-blue-500" />} title="Zero Wait Time" desc="Live updates" />
          <div className="hidden md:block w-px h-10 bg-slate-700"></div>
          <FeatureItem icon={<ShieldCheck className="text-emerald-500" />} title="100% Secure" desc="Encrypted data" />
          <div className="hidden md:block w-px h-10 bg-slate-700"></div>
          <FeatureItem icon={<Activity className="text-red-500" />} title="24/7 Monitoring" desc="Always online" />
        </div>
      </div>

      {/* --- CARDS --- */}
      <main id="portals" className="flex-grow pb-24 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Select Your Role</h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto mt-4 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
          <VibrantCard to="/auth/patient" title="Patient" icon={<User className="w-8 h-8 text-white" />} desc="Book Appointments" color="bg-gradient-to-br from-blue-600 to-blue-800" glow="group-hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.6)]" />
          <VibrantCard to="/auth/doctor" title="Doctor" icon={<Stethoscope className="w-8 h-8 text-white" />} desc="Manage Patients" color="bg-gradient-to-br from-emerald-600 to-emerald-800" glow="group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)]" />
          <VibrantCard to="/auth/staff" title="Staff" icon={<Clipboard className="w-8 h-8 text-white" />} desc="Front Desk Ops" color="bg-gradient-to-br from-violet-600 to-violet-800" glow="group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]" />
          <VibrantCard to="/auth/admin" title="Admin" icon={<Lock className="w-8 h-8 text-white" />} desc="System Settings" color="bg-gradient-to-br from-slate-700 to-slate-900" glow="group-hover:shadow-[0_0_30px_-5px_rgba(148,163,184,0.4)]" />
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-600" />
            <span className="font-bold tracking-wide text-slate-200">OMISHA CLINIC</span>
          </div>
          <div className="text-xs">&copy; 2025 Omisha Healthcare.</div>
        </div>
      </footer>
    </div>
  );
}

// --- FIXED: COMPLETELY RED & RANDOM EKG ---
function RealTimeEKG() {
  const canvasRef = useRef(null);
  
  // State for drawing positions
  const state = useRef({
    x: 0,
    y: 0,
    queue: [], // Holds the upcoming Y-offsets
  });

  // Function to generate a RANDOM beat every time
  const generateBeat = () => {
    // Randomize Amplitude (Height of the spike)
    // Base spike is -90, we add random variation between -40 and +20
    const spikeHeight = -90 + (Math.random() * 60 - 30);
    
    // Randomize Interval (Heart Rate variability)
    // Wait time between beats varies between 30 and 60 frames
    const waitTime = Math.floor(30 + Math.random() * 30);

    return [
        // P Wave (Small hump) - Randomize slightly
        -5, -10, -12 - Math.random() * 5, -10, -5, 0, 0,
        // Q (Dip)
        5, 10, 
        // R (THE BIG SPIKE) - Uses random height
        -20, spikeHeight * 0.5, spikeHeight, spikeHeight * 0.5, -20,
        // S (Dip down)
        25, 10, 0,
        // ST Segment
        0, 0, 0, 0, 0,
        // T Wave (Broad hump) - Randomize height
        -5, -15, -20 - Math.random() * 10, -15, -5, 0,
        // The Waiting Period (Flatline until next beat)
        ...Array(waitTime).fill(0)
    ];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const setSize = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        state.current.y = canvas.height / 2;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const speed = 3; // Slightly faster for better flow

    const animate = () => {
        const s = state.current;
        const h = canvas.height;
        const w = canvas.width;
        const centerY = h / 2;

        // 1. Wiper: Clear ahead
        ctx.clearRect(s.x, 0, speed + 10, h);

        // 2. Refill Queue if empty
        if (s.queue.length === 0) {
            s.queue = generateBeat();
        }

        // 3. Get next offset
        let offset = s.queue.shift(); // Get first item and remove it

        // Add CHAOS/NOISE to the line (Random jaggedness)
        // Even flat lines will jitter slightly
        const noise = (Math.random() - 0.5) * 4;
        offset += noise;

        const nextY = centerY + offset;

        // 4. Draw Line
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + speed, nextY);
        
        // === COLOR FIX: PURE RED ===
        ctx.lineWidth = 3; // Thicker line to see color better
        ctx.strokeStyle = "#dc2626"; // Tailwind Red-600 (Deep Red)
        ctx.shadowColor = "#ef4444"; // Tailwind Red-500 (Bright Glow)
        ctx.shadowBlur = 15; // Stronger Glow
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // === DOT FIX: PURE RED ===
        ctx.beginPath();
        ctx.fillStyle = "#ef4444"; // Bright Red Dot
        ctx.shadowColor = "#ef4444"; // Red Glow
        ctx.shadowBlur = 20;
        ctx.arc(s.x + speed, nextY, 3, 0, Math.PI * 2);
        ctx.fill();

        // 5. Update Position
        s.x += speed;
        s.y = nextY;

        // 6. Loop Screen
        if (s.x > w) {
            s.x = 0;
            s.y = nextY; // Reset Y
            ctx.beginPath(); // Break path
        }

        requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', setSize);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
             backgroundSize: '40px 40px' 
           }}>
      </div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 w-full md:w-auto px-2">
      <div className="p-3 bg-slate-800 rounded-xl shadow-inner border border-slate-700/50">
        {React.cloneElement(icon, { className: "w-6 h-6 " + icon.props.className })}
      </div>
      <div>
        <h3 className="font-bold text-slate-200 text-sm">{title}</h3>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  )
}

function VibrantCard({ to, title, desc, icon, color, glow }) {
  return (
    <Link to={to} className={`group relative overflow-hidden rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-2 ${color} ${glow}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
      <div className="relative z-10 flex flex-col items-start h-full">
        <div className="mb-4 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">{icon}</div>
        <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
        <p className="text-white/70 text-xs font-medium mb-8 uppercase tracking-wider">{desc}</p>
        <div className="mt-auto flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">Login <ArrowRight className="w-4 h-4" /></div>
      </div>
    </Link>
  )
}