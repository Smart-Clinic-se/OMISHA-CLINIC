import React, { useState, useEffect, useRef } from "react";
import { getQueueAPI, listenToQueueUpdates } from "../../api";
import { Activity } from "lucide-react";

export default function PageTVDisplay() {
    const [queues, setQueues] = useState({});
    const audioRef = useRef(new Audio("https://assets.mixkit.co/sfx/preview/mixkit-airport-announcement-ding-1569.mp3"));

    // --- LOGIC STARTS (UNCHANGED) ---
    const fetchAll = async () => {
        try {
            // Fetch ALL active queue items for today
            const res = await getQueueAPI({ allStatus: true });

            // Access res.data.data (Array)
            const queueData = res.data.data || [];

            // Group by Doctor
            const grouped = queueData.reduce((acc, p) => {
                if (!p.assignedTo) return acc; // Safety check

                const docName = p.assignedTo.name;
                const docSpecialization = p.assignedTo.specialization || "General Physician";

                if (!acc[docName]) {
                    acc[docName] = {
                        current: null,
                        waiting: [],
                        specialization: docSpecialization,
                        // Use the new availabilityStatus field
                        status: p.assignedTo.availabilityStatus || 'Available',
                        breakUntil: p.assignedTo.breakUntil
                    };
                }

                if (p.status === 'In-Cabin') acc[docName].current = p;
                if (p.status === 'Waiting') acc[docName].waiting.push(p);

                return acc;
            }, {});
            setQueues(grouped);
        } catch (err) {
            console.error("TV Fetch Error:", err);
        }
    };

    useEffect(() => {
        fetchAll();

        const cleanup = listenToQueueUpdates((payload) => {
            fetchAll();

            // Play Sound only if a patient enters cabin
            if (payload.type === 'UPDATE' && payload.calledToken) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log("Audio autoplay blocked:", e));
            }
        });

        // Fallback polling every 10s to ensure screen is never stale
        const interval = setInterval(fetchAll, 10000);

        return () => {
            cleanup();
            clearInterval(interval);
        };
    }, []);
    // --- LOGIC ENDS ---

    return (
        // STYLING FIX: Changed overflow-hidden to overflow-y-auto for mobile scrolling
        <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-8 font-sans overflow-y-auto">

            {/* Top Bar - STYLING FIX: flex-col for mobile, flex-row for desktop */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 border-b border-slate-800 pb-4 gap-6 md:gap-0">
                
                {/* Logo Section */}
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50">
                        {/* STYLING FIX: Smaller icon on mobile */}
                        <Activity className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                        {/* STYLING FIX: Smaller text on mobile (text-2xl) vs desktop (text-4xl) */}
                        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            OMISHA CLINIC
                        </h1>
                        <p className="text-slate-400 text-sm md:text-lg tracking-wider font-medium">Live Queue Status</p>
                    </div>
                </div>

                {/* Clock Section - STYLING FIX: Centered on mobile, Right aligned on desktop */}
                <div className="text-center md:text-right">
                    <p className="text-3xl md:text-5xl font-bold text-white tabular-nums tracking-tight">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-slate-500 text-sm md:text-xl font-medium mt-1">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Queue Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

                {Object.keys(queues).length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 md:py-40 text-slate-600 animate-pulse">
                        <Activity className="w-16 h-16 md:w-20 md:h-20 mb-4 opacity-20" />
                        <p className="text-xl md:text-3xl font-light text-center">Waiting for queue to start...</p>
                    </div>
                )}

                {Object.entries(queues).map(([doctor, data]) => (
                    <div key={doctor} className="bg-slate-900/50 backdrop-blur-md rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-full relative group">

                        {/* Doctor Header */}
                        <div className="bg-slate-900/80 p-4 md:p-5 text-center border-b border-slate-800">
                            <h2 className="text-xl md:text-2xl font-bold text-white truncate">Dr. {doctor}</h2>
                            <div className="flex justify-center items-center gap-2 mt-2">
                                <span className="text-cyan-400 text-[10px] md:text-xs uppercase tracking-widest font-bold px-2 py-1 bg-cyan-950/50 border border-cyan-900 rounded">
                                    {data.specialization}
                                </span>

                                {/* Status Indicator */}
                                {data.status === 'On Break' && (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] px-2 py-1 rounded font-bold animate-pulse">
                                        ON BREAK
                                    </span>
                                )}
                                {data.status === 'Not Available' && (
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] px-2 py-1 rounded font-bold">
                                        OFFLINE
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Now Serving - STYLING FIX: Adjust padding and text size for mobile */}
                        <div className="p-6 md:p-8 text-center bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex-1 flex flex-col justify-center relative">
                            <p className="text-[10px] md:text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-4">NOW SERVING</p>
                            {data.current ? (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <p className="text-6xl md:text-7xl font-black font-mono text-white tracking-tighter drop-shadow-2xl">
                                        {data.current.tokenNumber}
                                    </p>
                                    <p className="text-lg md:text-xl text-slate-300 mt-4 font-medium truncate px-2">{data.current.patientName}</p>
                                </div>
                            ) : (
                                <div className="opacity-30">
                                    <p className="text-5xl md:text-6xl font-mono text-slate-600">---</p>
                                    <p className="text-xs md:text-sm text-slate-500 mt-4">Next patient please wait</p>
                                </div>
                            )}
                        </div>

                        {/* Up Next List */}
                        <div className="bg-slate-950/50 p-4 border-t border-slate-800 backdrop-blur-sm">
                            <div className="flex justify-between items-end mb-3 px-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Up Next</p>
                                <span className="text-[10px] font-bold text-slate-600">{data.waiting.length} waiting</span>
                            </div>

                            <div className="space-y-2 min-h-[80px] md:min-h-[100px]">
                                {data.waiting.slice(0, 2).map((p) => (
                                    <div key={p._id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="font-mono text-lg md:text-xl font-bold text-yellow-400">{p.tokenNumber}</span>
                                        <span className="text-slate-300 text-xs md:text-sm font-medium truncate max-w-[100px] md:max-w-[120px]">{p.patientName}</span>
                                    </div>
                                ))}
                                {data.waiting.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-slate-600 italic text-xs">
                                        No patients in queue
                                    </div>
                                )}
                                {data.waiting.length > 2 && (
                                    <p className="text-center text-slate-500 text-xs mt-2 font-medium">
                                        +{data.waiting.length - 2} others in line
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}