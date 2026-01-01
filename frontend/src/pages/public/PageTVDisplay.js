import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getQueueAPI, listenToQueueUpdates } from "../../api";
import { Activity, Clock, User, ArrowRight, Home } from "lucide-react";
import { playAnnouncementSound } from "../../utils/audio";

export default function PageTVDisplay() {
    const [queues, setQueues] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- DATA FETCHING ---
    const fetchAll = async () => {
        try {
            const res = await getQueueAPI({ allStatus: true });
            const queueData = res.data.data || [];
            console.log("TV Fetch Data:", queueData);

            const newGrouped = {};

            queueData.forEach(item => {
                const doc = item.assignedTo;

                // Fallback for missing/deleted doctor references
                let docName = (doc && doc.name) ? doc.name : "Unknown Doctor";
                let docSpec = (doc && doc.specialization) ? doc.specialization : "General";
                let docStatus = (doc && doc.availabilityStatus) ? doc.availabilityStatus : "Available";

                if (doc && !doc.name) {
                    // If doc is just an ID (populate failed)
                    docName = "Dr. " + String(doc).slice(-6);
                }

                if (!newGrouped[docName]) {
                    newGrouped[docName] = {
                        specialization: docSpec,
                        status: docStatus,
                        current: null,
                        waiting: []
                    };
                }

                if (doc && doc.availabilityStatus) {
                    newGrouped[docName].status = doc.availabilityStatus;
                }

                if (item.status === 'In-Cabin') {
                    newGrouped[docName].current = item;
                } else if (item.status === 'Waiting') {
                    newGrouped[docName].waiting.push(item);
                }
            });

            console.log("Grouped Queue:", newGrouped);
            setQueues(newGrouped);
        } catch (err) {
            console.error("TV Error:", err);
        }
    };

    useEffect(() => {
        fetchAll();
        const cleanup = listenToQueueUpdates((payload) => {
            fetchAll();
            if (payload.type === 'UPDATE' && payload.calledToken) {
                playAnnouncementSound();
            }
        });

        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        const pollInterval = setInterval(fetchAll, 10000);

        return () => {
            cleanup();
            clearInterval(timeInterval);
            clearInterval(pollInterval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans p-3 overflow-hidden flex flex-col transition-colors duration-300">

            {/* --- BACK TO HOME --- */}
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold mb-4 w-fit">
                <Home className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-base">Back to Home</span>
            </Link>

            {/* --- HEADER --- */}
            {/* Restored flex-row but with tighter spacing and smaller fonts on mobile */}
            <header className="flex flex-row justify-between items-end mb-3 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 md:gap-2">
                    <div className="p-3 md:p-3 bg-blue-600 rounded-lg shadow-md">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base md:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none md:leading-normal p-1">
                            OMISHA <span className="text-blue-600 dark:text-blue-400">CLINIC</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold tracking-widest uppercase p-1">
                            Queue Display
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-base md:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none md:leading-normal p-1">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold tracking-widest uppercase p-1">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* --- GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 content-start">

                {Object.keys(queues).length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-96 opacity-50">
                        <Activity className="w-16 h-16 mb-4 text-slate-400" />
                        <p className="text-xl font-medium text-slate-500">System Standing By...</p>
                    </div>
                )}

                {Object.entries(queues).map(([doctor, data]) => (
                    <div key={doctor} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full max-h-[350px]">

                        {/* 1. Doctor Header */}
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">Dr. {doctor}</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.specialization}</p>
                            </div>

                            {/* Status Badge */}
                            {data.status === 'On Break' ? (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded border border-amber-200">On Break</span>
                            ) : data.status === 'Not Available' ? (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded border border-red-200">Offline</span>
                            ) : (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded border border-emerald-200">Active</span>
                            )}
                        </div>

                        {/* 2. Current Token (Hero) */}
                        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-white dark:bg-slate-900 relative">
                            {/* Watermark Pattern */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Now Serving</p>

                            {data.current ? (
                                <div className="text-center relative z-10">
                                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight truncate max-w-[250px] mx-auto">
                                        {data.current.patientName}
                                    </div>
                                    <div className="mt-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 inline-block">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                            Token: {data.current.tokenNumber}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center opacity-40">
                                    <span className="text-5xl font-mono font-bold text-slate-300 dark:text-slate-700">--</span>
                                    <p className="text-xs font-bold mt-2">Ready</p>
                                </div>
                            )}
                        </div>

                        {/* 3. Up Next List (Compact) */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Up Next</p>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {data.waiting.length} Waiting
                                </span>
                            </div>

                            <div className="space-y-2 min-h-[80px]">
                                {data.waiting.slice(0, 2).map((p) => (
                                    <div key={p._id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.patientName}</span>
                                            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 shrink-0">#{p.tokenNumber}</span>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                    </div>
                                ))}

                                {data.waiting.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-4">
                                        Queue is empty
                                    </div>
                                )}

                                {data.waiting.length > 2 && (
                                    <div className="text-center pt-1">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            +{data.waiting.length - 2} more patients
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Omisha Healthcare System</span>
                <span>Secure • Real-time • {currentTime.getFullYear()}</span>
            </div>
        </div>
    );
}