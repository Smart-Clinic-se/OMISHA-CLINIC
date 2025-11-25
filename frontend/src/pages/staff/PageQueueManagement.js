import React, { useState, useEffect, useCallback } from "react";
import {
    getQueueAPI,
    updateQueueStatusAPI,
    getDoctorsAPI,
    addToQueueAPI,
    listenToQueueUpdates,
} from "../../api";
import toast from "react-hot-toast";
import {
    UserPlus,
    Megaphone,
    SkipForward,
    XCircle,
    CreditCard,
    Clock,
    Users,
    X,
    Droplet
} from "lucide-react";

export default function PageQueueManagement() {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // New User Credentials Modal State
    const [newCredentials, setNewCredentials] = useState(null);

    // Walk-in Form Data - Split Name & Blood Group
    const [formData, setFormData] = useState({
        firstName: "", // Split
        lastName: "",  // Split
        age: "",
        gender: "",
        mobile: "",
        complaint: "",
        visitType: "New",
        bloodGroup: ""
    });

    // Load Doctors
    useEffect(() => {
        const load = async () => {
            try {
                const res = await getDoctorsAPI();
                setDoctors(res.data || []);
                if (res.data.length > 0) setSelectedDoctor(res.data[0]._id);
            } catch (err) { console.error(err); }
        };
        load();
    }, []);

    // Fetch Queue
    const fetchQueue = useCallback(async () => {
        if (!selectedDoctor) return;
        setLoading(true);
        try {
            const res = await getQueueAPI({ doctorId: selectedDoctor });
            setQueue(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedDoctor]);

    // Real-time Listeners
    useEffect(() => {
        fetchQueue();
        const cleanup = listenToQueueUpdates((payload) => {
            if (payload.doctorId && payload.doctorId !== selectedDoctor) return;
            fetchQueue();
        });
        return cleanup;
    }, [selectedDoctor, fetchQueue]);

    // Action: Update Status
    const updateStatus = async (id, status) => {
        setProcessingId(id);
        try {
            await updateQueueStatusAPI(id, { status });
            toast.success(`Marked as ${status}`);
        } catch (err) {
            toast.error("Action Failed");
        } finally {
            setProcessingId(null);
        }
    };

    // Action: Toggle Payment
    const togglePayment = async (item) => {
        const newStatus = item.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
        try {
            setQueue(queue.map(q => q._id === item._id ? { ...q, paymentStatus: newStatus } : q));
            await updateQueueStatusAPI(item._id, { paymentStatus: newStatus });
            toast.success(`Payment updated: ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update payment");
            fetchQueue();
        }
    };

    // Action: Add Walk-in Patient
    const handleWalkIn = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return toast.error("Select a doctor first");
        if (!formData.bloodGroup) return toast.error("Blood Group is required");

        setProcessingId("walkin");
        try {
            const res = await addToQueueAPI({
                firstName: formData.firstName.trim(), // Split
                lastName: formData.lastName.trim(),   // Split
                age: parseInt(formData.age),
                gender: formData.gender,
                patientMobile: formData.mobile.trim() || null,
                chiefComplaint: formData.complaint.trim(),
                visitType: formData.visitType,
                bloodGroup: formData.bloodGroup,
                assignedTo: selectedDoctor,
                bookingSource: "Walk-in"
            });

            // Reset Form
            setFormData({
                firstName: "", lastName: "",
                age: "", gender: "", mobile: "", complaint: "",
                visitType: "New", bloodGroup: ""
            });

            toast.success(`Token Generated: ${res.data.tokenNumber}`, { duration: 4000, icon: "🎟️" });

            if (res.data.newUserCredentials) {
                setNewCredentials(res.data.newUserCredentials);
            }

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add patient");
        } finally {
            setProcessingId(null);
        }
    };

    const waitingList = Array.isArray(queue) ? queue.filter(p => p.status === 'Waiting') : [];
    const inCabin = Array.isArray(queue) ? queue.find(p => p.status === 'In-Cabin') : null;

    return (
        <div className="max-w-7xl mx-auto p-4 relative">

            {/* --- NEW USER CREDENTIALS MODAL --- */}
            {newCredentials && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-emerald-500">
                        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <UserPlus className="w-6 h-6" /> New Account Created
                            </h3>
                            <button onClick={() => setNewCredentials(null)} className="hover:bg-emerald-700 p-1 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-400">Please share these login details with the patient:</p>

                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Login ID (Username)</p>
                                    <div className="text-xl font-mono font-bold text-white">{newCredentials.username}</div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Password</p>
                                    <div className="text-xl font-mono font-bold text-blue-400">{newCredentials.password}</div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 italic text-center">
                                Patient can change this password later from their settings.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                            <button
                                onClick={() => setNewCredentials(null)}
                                className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Queue Manager</h1>
                    <p className="text-slate-400">Register walk-ins and manage patient flow.</p>
                </div>

                {/* Doctor Selector */}
                <div className="w-full md:w-64">
                    <select
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        {doctors.map(d => (
                            <option key={d._id} value={d._id}>Dr. {d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: WALK-IN FORM --- */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-sm border border-slate-800 p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-500" /> Walk-in Registration
                        </h3>
                        <form onSubmit={handleWalkIn} className="space-y-3">
                            {/* SPLIT NAME FIELDS */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    required
                                    placeholder="First Name *"
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-white placeholder-slate-500"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                />
                                <input
                                    required
                                    placeholder="Last Name *"
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-white placeholder-slate-500"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>

                            {/* Age, Gender & Blood Group (3 cols) */}
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    required
                                    type="number"
                                    placeholder="Age *"
                                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-white placeholder-slate-500"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                                <select
                                    required
                                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-white"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Sex</option>
                                    <option value="Male">M</option>
                                    <option value="Female">F</option>
                                    <option value="Other">O</option>
                                </select>
                                <select
                                    required
                                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm text-white"
                                    value={formData.bloodGroup}
                                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                                >
                                    <option value="">Grp</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>

                            <input
                                required
                                placeholder="Mobile Number *"
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-white placeholder-slate-500"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-400"
                                    value={formData.visitType}
                                    onChange={e => setFormData({ ...formData, visitType: e.target.value })}
                                >
                                    <option value="New">New Visit</option>
                                    <option value="Follow-up">Follow-up</option>
                                </select>
                                <div className="flex items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    Visit Type
                                </div>
                            </div>

                            <textarea
                                required
                                placeholder="Chief Complaint *"
                                rows={2}
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 resize-none text-white placeholder-slate-500"
                                value={formData.complaint}
                                onChange={e => setFormData({ ...formData, complaint: e.target.value })}
                            />

                            <button
                                type="submit"
                                disabled={processingId === "walkin"}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95"
                            >
                                {processingId === "walkin" ? "Generating..." : "Generate Token"}
                            </button>
                        </form>
                    </div>

                    {/* Current In-Cabin Status */}
                    <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-6 text-center">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Currently Serving</h3>
                        {inCabin ? (
                            <>
                                <div className="text-4xl font-black text-emerald-500 font-mono">{inCabin.tokenNumber}</div>
                                <div className="text-lg font-medium text-emerald-400 mt-1">{inCabin.patientName}</div>
                                <div className="text-xs text-emerald-500/80 mt-2 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Called at {new Date(inCabin.calledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </>
                        ) : (
                            <div className="text-emerald-400 font-bold text-lg">Cabin Free</div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT: QUEUE LIST --- */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5" /> Waiting List ({waitingList.length})
                            </h3>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {waitingList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <p>No patients waiting</p>
                                </div>
                            ) : (
                                waitingList.map(p => (
                                    <div key={p._id} className={`flex flex-col md:flex-row items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:shadow-md transition-all ${processingId === p._id ? 'opacity-50 pointer-events-none' : ''}`}>

                                        {/* Patient Info */}
                                        <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                                            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-mono text-2xl font-black border border-blue-500/20">
                                                {p.tokenNumber}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{p.patientName}</h4>
                                                <div className="flex items-center gap-2 text-xs font-bold uppercase mt-1">
                                                    <span className={`px-2 py-0.5 rounded ${p.visitType === 'New' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                        {p.visitType}
                                                    </span>
                                                    <span className="text-slate-400">{p.gender}, {p.age}y</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">

                                            {/* Payment Toggle */}
                                            <button
                                                onClick={() => togglePayment(p)}
                                                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors ${p.paymentStatus === 'Paid'
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                                                    }`}
                                                title="Toggle Payment"
                                            >
                                                <CreditCard className="w-4 h-4 mb-1" />
                                                <span className="text-[10px] font-bold uppercase">{p.paymentStatus}</span>
                                            </button>

                                            <div className="w-px h-8 bg-slate-700 mx-1 hidden md:block"></div>

                                            {/* Status Buttons */}
                                            <button
                                                onClick={() => updateStatus(p._id, 'In-Cabin')}
                                                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <Megaphone className="w-4 h-4" /> Call
                                            </button>

                                            <div className="flex gap-1">
                                                <button onClick={() => updateStatus(p._id, 'Skipped')} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg" title="Skip">
                                                    <SkipForward className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => updateStatus(p._id, 'Cancelled')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Cancel">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}