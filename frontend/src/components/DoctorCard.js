import React from 'react';
import { Award, Briefcase, MapPin, User } from 'lucide-react';

export default function DoctorCard({ doctor }) {
    return (
        <div className="group relative h-full flex flex-col overflow-hidden rounded-xl border transition-all duration-500
            bg-white dark:bg-slate-800
            border-slate-200 dark:border-slate-700
            hover:border-blue-400 dark:hover:border-blue-500
            hover:shadow-lg dark:hover:shadow-blue-900/20
            w-full mx-auto
        ">
            {/* Glow Effect (Dark Mode only) */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Photo Section */}
            <div className="relative h-52 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700">
                {doctor.photo ? (
                    <img
                        src={doctor.photo}
                        alt={doctor.name}
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        {/* Fallback Icon if no photo */}
                        <User className="w-16 h-16 opacity-50" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t 
                    from-white via-white/40 to-transparent 
                    dark:from-slate-800 dark:via-slate-800/60 dark:to-transparent"
                ></div>

                <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-lg font-bold mb-0.5 transition-colors 
                        text-slate-900 dark:text-white 
                        group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    >
                        {doctor.name}
                    </h3>
                    <p className="font-bold tracking-wide uppercase text-[10px] 
                        text-blue-600 dark:text-blue-400"
                    >
                        {doctor.specialization || 'Specialist'}
                    </p>
                </div>
            </div>

            {/* Details Section */}
            <div className="p-4 pt-3 space-y-3 flex-grow flex flex-col justify-center">
                {/* Qualification */}
                <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md border shrink-0 
                        bg-emerald-50 border-emerald-100 text-emerald-600
                        dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500"
                    >
                        <Award className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest mb-0.5 
                            text-slate-400 dark:text-slate-500"
                        >
                            Qualification
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                            {doctor.qualification || 'MBBS, MD'}
                        </p>
                    </div>
                </div>

                {/* Experience */}
                <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md border shrink-0 
                        bg-amber-50 border-amber-100 text-amber-600
                        dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500"
                    >
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest mb-0.5 
                            text-slate-400 dark:text-slate-500"
                        >
                            Experience
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                            {doctor.experience || '10+ Years'}
                        </p>
                    </div>
                </div>

                {/* Hospital */}
                <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md border shrink-0 
                        bg-red-50 border-red-100 text-red-600
                        dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-500"
                    >
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest mb-0.5 
                            text-slate-400 dark:text-slate-500"
                        >
                            Hospital
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                            {doctor.hospitalName || 'Omisha Clinic'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}