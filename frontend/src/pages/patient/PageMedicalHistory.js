import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { getPatientHistoryAPI } from "../../api";
import { FileText, Download, Calendar, User, AlertCircle, Phone, MapPin, Mail, ArrowLeft } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from "react-hot-toast";

export default function PageMedicalHistory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfRecord, setPdfRecord] = useState(null);
    const printRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getPatientHistoryAPI({ patientId: user._id });
                setRecords(res.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchHistory();
    }, [user]);

    const generatePDF = async (record) => {
        setPdfRecord(record);
        // Wait for state update and DOM render
        setTimeout(async () => {
            const element = printRef.current;
            if (!element) {
                toast.error("Could not generate PDF");
                return;
            }

            const toastId = toast.loading("Generating Professional Report...");

            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                const safeDate = new Date(record.visitDate).toISOString().split('T')[0];
                pdf.save(`MEDICAL_REPORT_${safeDate}_${user.name.replace(/\s+/g, '_')}.pdf`);

                toast.success("Report Downloaded!", { id: toastId });
            } catch (err) {
                console.error(err);
                toast.error("Failed to generate PDF", { id: toastId });
            } finally {
                setPdfRecord(null);
            }
        }, 500);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate(`/app/patient/queue`, { replace: true })}
                className="mb-4 flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Live Queue
            </button>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-500" /> My Medical Records
                </h1>
                <p className="text-slate-400">View and download your past prescriptions.</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading records...</div>
            ) : records.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 backdrop-blur-md">
                    <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No medical history found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {records.map((rec) => (
                        <div key={rec._id} className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-xl shadow-black/20 border border-slate-800 overflow-hidden">

                            {/* === VIEW CARD === */}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                        <p className="font-bold text-white flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            {new Date(rec.visitDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                                        <p className="font-bold text-white flex items-center justify-end gap-2">
                                            <User className="w-4 h-4 text-blue-500" />
                                            Dr. {rec.doctorName}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Diagnosis</p>
                                    <h3 className="text-xl font-black text-white">{rec.diagnosis}</h3>
                                </div>

                                <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Prescribed Medicines
                                    </p>
                                    <div className="space-y-3">
                                        {rec.medicines.map((m, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-700 pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <span className="font-bold text-slate-200">{m.name}</span>
                                                    <span className="text-slate-400 text-xs ml-2">({m.strength})</span>
                                                    <div className="text-xs text-slate-500 mt-0.5">{m.instruction}</div>
                                                </div>
                                                <span className="font-mono font-bold bg-slate-900 px-2 py-1 rounded border border-slate-700 text-xs text-slate-400">
                                                    {m.dosageStyle}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* === ACTION FOOTER === */}
                            <div className="bg-slate-800/30 px-6 py-4 border-t border-slate-800 flex justify-end">
                                <button
                                    onClick={() => generatePDF(rec)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition transform hover:-translate-y-0.5"
                                >
                                    <Download className="w-4 h-4" /> Download Official Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* === HIDDEN PRINT TEMPLATE (KEEP LIGHT THEME FOR PRINTING) === */}
            {pdfRecord && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div ref={printRef} className="w-[210mm] min-h-[297mm] bg-white p-[15mm] text-slate-800 font-sans relative">

                        {/* Header */}
                        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-blue-900 tracking-tight mb-1">OMISHA CLINIC</h1>
                                <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">Excellence in Healthcare</p>
                            </div>
                            <div className="text-right text-sm text-slate-600 space-y-1">
                                <p className="flex items-center justify-end gap-2"><MapPin className="w-4 h-4 text-blue-500" /> 123 Health Avenue, Medical District</p>
                                <p className="flex items-center justify-end gap-2"><Phone className="w-4 h-4 text-blue-500" /> +1 (555) 123-4567</p>
                                <p className="flex items-center justify-end gap-2"><Mail className="w-4 h-4 text-blue-500" /> contact@omishaclinic.com</p>
                            </div>
                        </div>

                        {/* Patient & Doctor Info Grid */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Details</p>
                                    <p className="text-lg font-bold text-slate-800">{user.name}</p>
                                    <p className="text-sm text-slate-500">ID: {user._id.slice(-6).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Attending Physician</p>
                                    <p className="text-lg font-bold text-slate-800">Dr. {pdfRecord.doctorName}</p>
                                    <p className="text-sm text-slate-500">Date: {new Date(pdfRecord.visitDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Clinical Diagnosis</h2>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-r-lg border-l-4 border-blue-200">
                                <p className="text-xl font-medium text-blue-900">{pdfRecord.diagnosis}</p>
                            </div>
                        </div>

                        {/* Medicines Table */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Prescription Details</h2>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 border-b-2 border-slate-200">
                                        <th className="py-3 px-4 font-bold text-slate-600 text-sm uppercase">Medicine</th>
                                        <th className="py-3 px-4 font-bold text-slate-600 text-sm uppercase">Dosage</th>
                                        <th className="py-3 px-4 font-bold text-slate-600 text-sm uppercase">Instructions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pdfRecord.medicines.map((m, i) => (
                                        <tr key={i} className="even:bg-slate-50/50">
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-slate-800">{m.name}</p>
                                                <p className="text-xs text-slate-500">{m.strength}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="font-mono text-sm bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                                                    {m.dosageStyle}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-600">
                                                {m.instruction}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Notes if any */}
                        {pdfRecord.notes && (
                            <div className="mb-12">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Additional Notes</h3>
                                <p className="text-sm text-slate-600 italic bg-yellow-50 p-4 rounded border border-yellow-100">
                                    {pdfRecord.notes}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 w-full px-[15mm] pb-[15mm]">
                            <div className="flex justify-between items-end pt-8 border-t border-slate-200">
                                <div className="text-xs text-slate-400">
                                    <p>Generated on: {new Date().toLocaleString()}</p>
                                    <p>This is a computer-generated document. No signature is required.</p>
                                </div>
                                <div className="text-center">
                                    {/* Placeholder Signature */}
                                    <div className="font-handwriting text-2xl text-blue-800 mb-1 opacity-70">Dr. {pdfRecord.doctorName.split(' ').pop()}</div>
                                    <div className="h-px w-32 bg-slate-300 mb-1"></div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Authorized Signature</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}