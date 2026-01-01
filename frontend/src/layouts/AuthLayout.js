import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HeartPulse } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-main flex flex-col text-main transition-colors duration-300">
      {/* HEADER */}
      <header className="bg-secondary/80 backdrop-blur-xl border-b border-theme sticky top-0 z-50 transition-colors duration-300">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo / Brand -> GOES TO HOME */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-card-theme rounded-lg group-hover:bg-blue-500/10 transition-colors">
              <HeartPulse className="w-6 h-6 text-rose-500" />
            </div>
            <span className="text-xl font-bold text-main group-hover:text-rose-500 transition-colors">
              OMISHA CLINIC
            </span>
          </Link>

          {/* Navigation Actions -> GOES TO HOME */}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-main transition-colors"
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