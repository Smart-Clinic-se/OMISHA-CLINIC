import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { getPatientHistoryAPI } from "../../api";
import { FileText, Download, Stethoscope } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from "react-hot-toast";

export default function PageMedicalHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                const res = await getPatientHistoryAPI({ patientId: user._id });
                setHistory(res.data.data || []);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    const generatePDF = (record) => {
        const doc = new jsPDF();

        // --- CONSTANTS ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 15;
        const rightX = pageWidth - marginX;
        const contentWidth = pageWidth - (marginX * 2);

        // --- COLORS ---
        const colorBlue = [41, 128, 185];
        const colorSlate = [44, 62, 80];
        const colorGray = [127, 140, 141];
        const colorLightLine = [224, 224, 224];

        // ==========================================
        // 1. HEADER
        // ==========================================
        doc.setFillColor(...colorBlue);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("OMISHA CLINIC", marginX, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Advanced Healthcare Center", marginX, 26);

        // Contact Info
        doc.setFontSize(9);
        doc.text("123 Health Avenue, Medical District", rightX, 15, { align: "right" });
        doc.text("Ph: +91 98765 43210", rightX, 20, { align: "right" });
        doc.text("support@omishaclinic.com", rightX, 25, { align: "right" });

        // ==========================================
        // 2. META (Date & ID)
        // ==========================================
        let cursorY = 55;

        // Title
        doc.setTextColor(...colorSlate);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("OPD PRESCRIPTION", marginX, cursorY);

        // Date & ID
        doc.setTextColor(...colorGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const dateObj = new Date(record.visitDate);
        doc.text(`Date: ${dateObj.toLocaleDateString()}`, rightX, cursorY, { align: "right" });
        doc.text(`ID: #${record._id.slice(-6).toUpperCase()}`, rightX, cursorY + 5, { align: "right" });

        cursorY += 15;

        // ==========================================
        // 3. PATIENT DETAILS (PURE TEXT ONLY)
        // ==========================================
        // No rect(), no line(), just simple text columns.

        const col1 = marginX;
        const col2 = marginX + 65;
        const col3 = marginX + 130;

        const rowLabelY = cursorY;
        const rowValueY = cursorY + 5;

        const drawTextCol = (label, value, x) => {
            // Label
            doc.setFontSize(8);
            doc.setTextColor(160, 160, 160); // Lighter gray for labels
            doc.setFont("helvetica", "bold");
            doc.text(label.toUpperCase(), x, rowLabelY);

            // Value
            doc.setFontSize(11);
            doc.setTextColor(...colorSlate); // Dark for values
            doc.text(value || "-", x, rowValueY);
        };

        drawTextCol("PATIENT NAME", user.name, col1);
        drawTextCol("AGE / GENDER", `${user.age || "--"} Yrs / ${user.gender || "-"}`, col2);
        drawTextCol("MOBILE NUMBER", `+91 ${user.mobile || "--"}`, col3);

        cursorY += 20; // Pure whitespace spacing

        // ==========================================
        // 4. DIAGNOSIS
        // ==========================================
        doc.setTextColor(...colorBlue);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("DIAGNOSIS", marginX, cursorY);

        cursorY += 6;
        doc.setTextColor(...colorSlate);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const diagnosisText = doc.splitTextToSize(record.diagnosis || "Regular Checkup", contentWidth);
        doc.text(diagnosisText, marginX, cursorY);

        cursorY += (diagnosisText.length * 6) + 10;

        // ==========================================
        // 5. MEDICINE TABLE
        // ==========================================
        const tableBody = record.medicines.map(m => [
            m.name + (m.strength ? `\n(${m.strength})` : ''),
            m.dosageStyle || "-",
            m.duration || "-",
            m.instruction || "-"
        ]);

        autoTable(doc, {
            startY: cursorY,
            head: [['MEDICINE', 'DOSAGE', 'DURATION', 'INSTRUCTION']],
            body: tableBody,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 4,
                textColor: colorSlate,
                valign: 'middle',
                lineWidth: 0, // No borders
            },
            headStyles: {
                fillColor: colorBlue,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'left'
            },
            columnStyles: {
                0: { cellWidth: 70, fontStyle: 'bold' },
                1: { fontStyle: 'bold', textColor: colorBlue },
                3: { fontStyle: 'italic', textColor: colorGray }
            },
            didDrawCell: (data) => {
                // Subtle bottom border for rows
                if (data.section === 'body' && data.column.index === 0) {
                    const y = data.cell.y + data.cell.height;
                    doc.setDrawColor(...colorLightLine);
                    doc.line(data.cell.x, y, data.cell.x + contentWidth, y);
                }
            },
            didDrawPage: (data) => {
                cursorY = data.cursor.y;
            }
        });

        cursorY = doc.lastAutoTable.finalY + 15;

        // ==========================================
        // 6. NOTES
        // ==========================================
        if (record.notes) {
            if (cursorY > pageHeight - 50) {
                doc.addPage();
                cursorY = 20;
            }
            doc.setFontSize(10);
            doc.setTextColor(...colorSlate);
            doc.setFont("helvetica", "bold");
            doc.text("Doctor's Note:", marginX, cursorY);

            cursorY += 6;
            doc.setFont("helvetica", "normal");
            const noteText = doc.splitTextToSize(record.notes, contentWidth);
            doc.text(noteText, marginX, cursorY);
        }

        // ==========================================
        // 7. FOOTER (Exact Image Replica)
        // ==========================================
        const footerY = pageHeight - 35;
        const lineLength = 60;

        // A. Gray Line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(rightX - lineLength, footerY, rightX, footerY);

        // B. Name
        doc.setFontSize(12);
        doc.setTextColor(...colorSlate);
        doc.setFont("helvetica", "bold");
        doc.text(`Dr. ${record.doctorName}`, rightX, footerY + 6, { align: "right" });

        // C. Label
        doc.setFontSize(9);
        doc.setTextColor(149, 165, 166);
        doc.setFont("helvetica", "normal");
        doc.text("Authorized Signature", rightX, footerY + 11, { align: "right" });

        // D. Disclaimer
        doc.setFontSize(8);
        doc.setTextColor(189, 195, 199);
        doc.text("This prescription is generated digitally and is valid without a physical signature.", pageWidth / 2, pageHeight - 10, { align: "center" });

        // ==========================================
        // 8. SAVE
        // ==========================================
        const dateStr = dateObj.toISOString().split('T')[0];
        const safeName = (user.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

        doc.save(`OmishaClinic_Report_${safeName}_${dateStr}.pdf`);

        toast.success("PDF Downloaded");
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up p-4 md:p-0">
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
                    <span className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                        <FileText className="w-8 h-8" />
                    </span>
                    <span>My Medical History</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium ml-1">View your past consultation records.</p>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20"><p>Loading...</p></div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                        <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Records Found</h3>
                    <p className="text-slate-500 dark:text-slate-400">You haven't had any consultations yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map((rec) => (
                        <div key={rec._id} className="group bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                                        {new Date(rec.visitDate).toLocaleDateString()}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-1">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                                        <Stethoscope size={14} className="text-blue-500" /> Dr. {rec.doctorName}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {rec.diagnosis || "Consultation Record"}
                                </h3>
                            </div>

                            <button
                                onClick={() => generatePDF(rec)}
                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm shadow-lg shadow-slate-200 dark:shadow-none"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}