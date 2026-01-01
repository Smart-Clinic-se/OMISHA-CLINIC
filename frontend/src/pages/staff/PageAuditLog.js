import React, { useState, useEffect, useCallback } from "react";
import { getAuditLogsAPI, getDoctorsAPI, getUsersByRoleAPI } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import {
    Clock,
    Shield,
    User,
    Search,
    Filter,
    RefreshCw,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download
} from "lucide-react";
import Select from "../../components/ui/Select";

export default function PageAuditLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        action: "",
        staffId: "",
        role: "",
        search: ""
    });

    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

    // 1. Load Staff for Filters
    useEffect(() => {
        const loadStaff = async () => {
            try {
                // Fetch Doctors and Staff
                const [docs, staff] = await Promise.all([
                    getDoctorsAPI(),
                    getUsersByRoleAPI('staff')
                ]);
                // Combine and format
                const allStaff = [
                    ...docs.data.map(d => ({ value: d._id, label: `Dr. ${d.name}` })),
                    ...staff.data.map(s => ({ value: s._id, label: `${s.name} (Staff)` }))
                ];
                setStaffList(allStaff);
            } catch (err) {
                console.error("Failed to load staff list", err);
            }
        };
        loadStaff();
    }, []);

    // 2. Fetch Logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 50,
                ...filters
            };
            // Clean empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === "") delete params[key];
            });

            const res = await getAuditLogsAPI(params);
            setLogs(res.data.data || []);
            setPagination(res.data.pagination);
        } catch (error) {
            toast.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const clearFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            action: "",
            staffId: "",
            role: "",
            search: ""
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Helper for Badges
    const getActionStyle = (action) => {
        if (!action) return 'bg-slate-100 text-slate-600 border border-slate-200';
        if (action.includes('PAYMENT')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm';
        if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm';
        if (action.includes('OVERRIDE')) return 'bg-rose-100 text-rose-800 border border-rose-200 shadow-sm';
        if (action.includes('QUEUE')) return 'bg-purple-100 text-purple-800 border border-purple-200 shadow-sm';
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in-up">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                            <Shield className="w-8 h-8" />
                        </span>
                        System Audit Logs
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium ml-1">Track payments, overrides, and security events.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-3 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition"
                    title="Refresh Logs"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Filter className="w-4 h-4" /> Filters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Date Range */}
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={filters.startDate}
                            onChange={e => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={filters.endDate}
                            onChange={e => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>

                    {/* Staff Filter */}
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Performed By</label>
                        <Select
                            value={filters.staffId}
                            onChange={e => handleFilterChange('staffId', e.target.value)}
                            options={[{ value: "", label: "All Users" }, ...staffList]}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Action Type</label>
                        <Select
                            value={filters.action}
                            onChange={e => handleFilterChange('action', e.target.value)}
                            options={[
                                { value: "", label: "All Actions" },
                                { value: "PAYMENT_COLLECTED", label: "Payment Collected" },
                                { value: "PAYMENT_OVERRIDE", label: "Payment Override" },
                                { value: "LOGIN", label: "Login" },
                                { value: "REGISTER_PATIENT", label: "Patient Registration" },
                            ]}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Search */}
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Keywords</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full px-4 py-3 pl-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                placeholder="Search reason..."
                                value={filters.search}
                                onChange={e => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold underline">
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* --- LOG TABLE --- */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 tracking-wider">Timestamp</th>
                                <th className="p-4 tracking-wider">Action</th>
                                <th className="p-4 tracking-wider">Performed By</th>
                                <th className="p-4 tracking-wider">Details / Reason</th>
                                <th className="p-4 tracking-wider">Target ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-400">Loading logs...</td></tr>
                            ) : logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 transition-all duration-200 group">
                                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getActionStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase">
                                                    {log.performedBy?.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-xs">{log.performedBy?.name || "System/Unknown"}</div>
                                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">{log.role || log.performedBy?.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-200 font-medium max-w-xs truncate">
                                            {log.reason || "-"}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-400">
                                            {log.targetId ? log.targetId.slice(-6) : "-"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-400 italic">
                                        No logs found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}