import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HeartPulse } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      {/* HEADER */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo / Brand -> GOES TO HOME */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
              <HeartPulse className="w-6 h-6 text-rose-500" />
            </div>
            <span className="text-xl font-bold text-slate-100 group-hover:text-rose-500 transition-colors">
              OMISHA CLINIC
            </span>
          </Link>

          {/* Navigation Actions -> GOES TO HOME */}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </nav>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}