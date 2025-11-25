import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuditLogsAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import {
    Clock,
    Shield,
    User,
    FileText,
    Lock,
    Activity,
    Filter,
    RefreshCw,
    ArrowLeft
} from "lucide-react";

export default function PageAuditLog() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogsAPI();
            setLogs(res.data.data || []);
        } catch (error) {
            console.error("Error fetching logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Filter Logic
    const filteredLogs = filter === "All"
        ? logs
        : logs.filter(log => log.action.includes(filter.toUpperCase()));

    // Helper for Badges
    const getActionStyle = (action) => {
        if (action.includes('LOGIN')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (action.includes('REGISTER')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (action.includes('PASSWORD')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (action.includes('QUEUE')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        return 'bg-slate-800 text-slate-400 border-slate-700';
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <button
                onClick={() => navigate(`/app/staff/queue`, { replace: true })}
                className="mb-4 flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Queue Manager
            </button>

            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-500" /> System Audit Logs
                    </h1>
                    <p className="text-slate-400">Track security events, user access, and critical updates.</p>
                </div>
                <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* --- FILTERS --- */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-sm flex">
                    {['All', 'Login', 'Register', 'Queue', 'Password'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === f
                                ? "bg-slate-700 text-white shadow-md"
                                : "text-slate-400 hover:bg-slate-800"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- LOG TABLE --- */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Performed By</th>
                                <th className="p-4">Details / Reason</th>
                                <th className="p-4">Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-500">Loading logs...</td></tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-800/30 transition">
                                        <td className="p-4 text-slate-400 flex items-center gap-2 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getActionStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700">
                                                    {log.performedBy?.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-200">{log.performedBy?.name || "Unknown"}</div>
                                                    <div className="text-xs text-slate-500 uppercase">{log.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 font-medium">
                                            {log.reason || "No details provided"}
                                            {log.ipAddress && <div className="text-xs text-slate-500 mt-0.5">IP: {log.ipAddress}</div>}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-500">
                                            {log.targetType}: {log.targetId.slice(-6)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-500 italic">No logs found matching filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}