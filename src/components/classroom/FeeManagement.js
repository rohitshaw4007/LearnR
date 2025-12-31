"use client";
import { useState, useEffect, useRef } from "react"; // useRef imported
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  Download, Search, DollarSign, Users, AlertTriangle, CheckCircle, FileText, Ban, Loader2, 
  Calendar, CreditCard, User, X, Clock, ChevronRight, ShieldCheck, Hand, Banknote
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion"; 

export default function FeeManagement({ courseId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ stats: {}, students: [], graphData: [], courseFee: 0 }); 
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState({ 
      open: false, 
      student: null, 
      months: 1, 
      amount: 0, 
      mode: "Cash",
      cyclePreview: "" 
  });
  
  // --- NEW: UI State for Processing Button ---
  const [processing, setProcessing] = useState(false);
  
  // --- NEW: Instant Lock Ref (Prevents Double Clicks) ---
  const isSubmitting = useRef(false);

  const [historyModal, setHistoryModal] = useState({ open: false, history: [], student: null });

  // Helper to calculate target month names
  const getTargetMonths = (startFromDate, monthsCount) => {
    if (!startFromDate) return "N/A";
    const startDate = new Date(startFromDate);
    const endDate = new Date(startDate.getTime()); 
    endDate.setMonth(endDate.getMonth() + monthsCount - 1);
    
    const startStr = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (monthsCount === 1) return startStr;
    
    const endStr = endDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return `${startStr} to ${endStr}`;
  };

  // 1. Fetch Data
  const fetchData = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/fees?month=${selectedMonth}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setFilteredStudents(result.students || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [courseId, selectedMonth]);

  // 2. Filter Logic
  useEffect(() => {
    if (!searchTerm) setFilteredStudents(data.students || []);
    else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents((data.students || []).filter(s => 
        s.user?.name?.toLowerCase().includes(lower) || 
        s.user?.email?.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, data.students]);

  // --- Auto Calculate Amount & Month Name Function ---
  const handleMonthsChange = (e) => {
      const newMonths = parseInt(e.target.value) || 1;
      const unitPrice = data.courseFee || 0;
      
      let baseDate = paymentModal.student?.nextDue 
        ? new Date(paymentModal.student.nextDue) 
        : new Date();

      const cycle = getTargetMonths(baseDate, newMonths);

      setPaymentModal(prev => ({
          ...prev, 
          months: newMonths,
          amount: unitPrice * newMonths,
          cyclePreview: cycle
      }));
  };

  // Function to initialize Payment Modal
  const openPaymentModal = (student) => {
      if (!student) return;

      const unitPrice = data.courseFee || 0;
      let baseDate = student.nextDue ? new Date(student.nextDue) : new Date();
      const cycle = getTargetMonths(baseDate, 1);

      // Reset Locks
      setProcessing(false);
      isSubmitting.current = false;

      setPaymentModal({
          open: true,
          student: student,
          months: 1,
          amount: unitPrice,
          mode: "Cash",
          cyclePreview: cycle
      });
  };

  // 3. Payment Submit (Improved Visual Feedback)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // --- INSTANT LOCK ---
    if (isSubmitting.current) return; // Stop if already clicked
    isSubmitting.current = true; // Lock instantly
    setProcessing(true); // Update UI to "Processing..."

    const { student, amount, months, mode } = paymentModal;

    // Safety Check
    if (!student || !student._id) {
        alert("Error: Student data missing. Please reopen modal.");
        isSubmitting.current = false;
        setProcessing(false);
        return;
    }

    try {
        const res = await fetch(`/api/admin/courses/${courseId}/fees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                enrollmentId: student._id, 
                amount: Number(amount),
                months: Number(months),
                mode: mode 
            })
        });
        
        const response = await res.json();
        
        if (response.success) {
            alert(response.message);
            // Close Modal (This resets everything for next time)
            setPaymentModal({ open: false, student: null, months: 1, amount: 0, mode: "Cash", cyclePreview: "" });
            fetchData();
        } else {
            alert(response.error || "Payment failed");
            // Unlock only on error so they can retry
            isSubmitting.current = false;
            setProcessing(false);
        }
    } catch (err) {
        console.error("Payment Error:", err);
        alert("Payment failed: Network error.");
        isSubmitting.current = false;
        setProcessing(false);
    }
  };

  // 4. Handle Unblock Action
  const handleUnblockAction = async (enrollmentId, action) => {
    if(!confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
        const res = await fetch(`/api/admin/courses/${courseId}/fees`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enrollmentId, action })
        });
        const json = await res.json();
        if(json.success) {
            alert(json.message);
            fetchData(); 
        } else {
            alert(json.error);
        }
    } catch (err) {
        alert("Failed to process request");
    }
  };

  // 5. Generate Invoice
  const generateInvoice = (student, transaction) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const themeYellow = [255, 204, 0]; 
    const themeBlack = [10, 10, 10];   
    const textGray = [80, 80, 80];

    doc.setFillColor(...themeBlack);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setTextColor(...themeYellow);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("LEARNR", 20, 32);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200); 
    doc.text("Premium Education Platform", 20, 40);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("support@learnr.com", pageWidth - 20, 25, { align: "right" });
    doc.text("www.learnr.com", pageWidth - 20, 35, { align: "right" });

    doc.setFillColor(...themeYellow);
    doc.rect(0, 50, pageWidth, 15, "F");
    
    doc.setTextColor(...themeBlack);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT / INVOICE", 20, 60);

    const txnDate = new Date(transaction.date);
    
    doc.setTextColor(...themeBlack);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO:", 20, 85);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(student.user?.name?.toUpperCase() || "STUDENT", 20, 93);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...textGray);
    doc.text(student.user?.email || "", 20, 100);
    doc.text(`Student ID: ${student._id.slice(-8).toUpperCase()}`, 20, 105);

    const metaX = pageWidth - 80;
    doc.setTextColor(...themeBlack);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No:", metaX, 85);
    doc.text("Date:", metaX, 92);
    doc.text("Mode:", metaX, 99); 
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    doc.text(`#${transaction.transactionId.slice(-8).toUpperCase()}`, pageWidth - 20, 85, { align: "right" });
    doc.text(txnDate.toLocaleDateString(), pageWidth - 20, 92, { align: "right" });
    doc.text(transaction.method || "Online", pageWidth - 20, 99, { align: "right" });

    autoTable(doc, {
      startY: 120,
      head: [['Item Description', 'Billing Cycle', 'Payment Mode', 'Amount']],
      body: [[
        'Course Subscription Fee', 
        transaction.month || 'Monthly Subscription', 
        transaction.method || 'Online / Card', 
        `INR ${transaction.amount}.00`
      ]],
      theme: 'grid',
      headStyles: { 
          fillColor: themeBlack,      
          textColor: themeYellow,     
          fontStyle: 'bold', 
          halign: 'center',
          minCellHeight: 14,
          lineWidth: 0
      },
      bodyStyles: { 
          textColor: [0, 0, 0], 
          fontSize: 10, 
          cellPadding: 8,
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
      },
      columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' }, 
          3: { fontStyle: 'bold', halign: 'right' } 
      },
      alternateRowStyles: { fillColor: [255, 253, 230] } 
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(...themeBlack);
    doc.rect(pageWidth - 90, finalY, 70, 25, "F"); 
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text("Total Paid:", pageWidth - 80, finalY + 8);
    doc.setFontSize(18);
    doc.setTextColor(...themeYellow);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${transaction.amount}`, pageWidth - 25, finalY + 18, { align: "right" });

    doc.setDrawColor(...themeBlack);
    doc.setLineWidth(2);
    doc.rect(20, finalY + 2, 40, 15, "S"); 
    doc.setFontSize(12);
    doc.setTextColor(...themeBlack);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", 40, finalY + 11, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    
    const footerY = pageHeight - 30;
    doc.text("Terms:", 20, footerY);
    doc.setFontSize(8);
    doc.text("System generated invoice. No signature required.", 20, footerY + 5);

    doc.setFillColor(...themeBlack);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    doc.setTextColor(...themeYellow);
    doc.setFontSize(8);
    doc.text("© 2024 LearnR Inc. All rights reserved.", pageWidth / 2, pageHeight - 4, { align: "center" });
    
    doc.save(`Invoice_${student.user?.name}_${transaction.transactionId}.pdf`);
  };

  const exportData = () => {
    if (!filteredStudents.length) return alert("No data");
    const ws = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
        Name: s.user?.name,
        Email: s.user?.email,
        Status: s.status,
        PaidThisMonth: s.totalPaidMonth,
        NextDue: s.nextDue ? new Date(s.nextDue).toDateString() : "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee_Report");
    XLSX.writeFile(wb, "Fee_Report.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 space-y-8 pb-32 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent filter drop-shadow-md">
                Fee Management Console
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage subscriptions, advance payments & invoices.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <button onClick={exportData} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_-5px_rgba(34,197,94,0.6)]">
                <Download size={16} /> Excel Export
            </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
           <Loader2 className="h-10 w-10 animate-spin mb-4 text-yellow-500" />
           <p className="animate-pulse">Loading Financial Data...</p>
        </div>
      ) : (
        <>
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<DollarSign className="text-green-400" />} title="Total Revenue (This Month)" value={`₹${data.stats?.totalRevenue?.toLocaleString() || 0}`} color="bg-green-900/10 border-green-500/30" />
            <StatCard icon={<CheckCircle className="text-blue-400" />} title="Paid Students" value={data.stats?.paidCount || 0} color="bg-blue-900/10 border-blue-500/30" />
            <StatCard icon={<AlertTriangle className="text-yellow-400" />} title="Pending / Due" value={data.stats?.pendingCount || 0} color="bg-yellow-900/10 border-yellow-500/30" />
            <StatCard icon={<Ban className="text-red-400" />} title="Blocked" value={data.stats?.blockedCount || 0} color="bg-red-900/10 border-red-500/30" />
          </div>

          {/* GRAPHS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111] p-6 rounded-2xl border border-gray-800 h-96 relative overflow-hidden group">
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={data.graphData || []}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#EAB308" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 h-96 flex flex-col items-center justify-center relative">
                 <h3 className="text-lg font-bold mb-4 w-full text-left flex items-center gap-2">
                    <Users size={18} className="text-blue-500"/> Payment Status
                </h3>
                <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Paid', value: data.stats?.paidCount || 0 },
                                { name: 'Pending', value: data.stats?.pendingCount || 0 },
                                { name: 'Blocked', value: data.stats?.blockedCount || 0 },
                            ]}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                        >
                            <Cell fill="#3B82F6" stroke="rgba(59, 130, 246, 0.5)" strokeWidth={2} />
                            <Cell fill="#EAB308" stroke="rgba(234, 179, 8, 0.5)" strokeWidth={2} />
                            <Cell fill="#EF4444" stroke="rgba(239, 68, 68, 0.5)" strokeWidth={2} />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* STUDENTS TABLE */}
          <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="text-purple-400"/> Student Records
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full md:w-64"
                    />
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Next Due Date</th>
                            <th className="p-4">Paid (This Month)</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredStudents.length > 0 ? filteredStudents.map((enroll) => (
                            <tr key={enroll._id} className="hover:bg-gray-800/50 transition-colors group cursor-pointer" onClick={() => setHistoryModal({ open: true, history: enroll.paymentHistory, student: enroll })}>
                                <td className="p-4">
                                    <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">{enroll.user?.name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{enroll.user?.email}</div>
                                    
                                    {/* PENDING REQUEST INDICATOR */}
                                    {enroll.unblockRequest?.status === "pending" && (
                                       <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                                           <Hand size={10} /> Requesting Unblock
                                       </span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-300">
                                    {enroll.nextDue ? new Date(enroll.nextDue).toDateString() : "N/A"}
                                </td>
                                <td className="p-4 font-mono text-green-400 font-bold shadow-green-900/20">
                                    ₹{enroll.totalPaidMonth || 0}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={enroll.status} />
                                </td>
                                <td className="p-4 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    
                                    {enroll.unblockRequest?.status === "pending" ? (
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleUnblockAction(enroll._id, "approve")}
                                                className="p-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600 hover:text-white transition-all text-xs font-bold"
                                                title="Approve & Unblock"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUnblockAction(enroll._id, "reject")}
                                                className="p-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-bold"
                                                title="Reject"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => openPaymentModal(enroll)} 
                                                className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow hover:shadow-blue-500/50"
                                                title="Manual / Advance Payment"
                                            >
                                                <DollarSign size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setHistoryModal({ open: true, history: enroll.paymentHistory, student: enroll })}
                                                className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow hover:shadow-purple-500/50"
                                                title="Full History"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </>
                                    )}

                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* --- MODALS --- */}

      {/* 1. ADVANCE / MANUAL PAYMENT MODAL */}
      <AnimatePresence>
      {paymentModal.open && (
        <motion.div 
            key={paymentModal.student?._id || 'modal'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-[#121212] border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)] relative overflow-hidden"
            >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Banknote className="text-green-500"/> Record Payment
                    </h3>
                    <button onClick={() => setPaymentModal(prev => ({...prev, open:false, student:null}))} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                {paymentModal.student && (
                <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10 relative z-10">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Student</p>
                    <p className="text-white font-bold text-lg">{paymentModal.student.user?.name}</p>
                    
                    {/* --- SHOW MONTH NAME PREVIEW HERE --- */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Paying For:</span>
                        <span className="text-sm text-green-400 font-bold">{paymentModal.cyclePreview}</span>
                    </div>
                </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-5 relative z-10">
                    
                    {/* Payment Mode Selector */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Payment Mode</label>
                        <select 
                            value={paymentModal.mode}
                            onChange={(e) => setPaymentModal(prev => ({...prev, mode: e.target.value}))}
                            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                        >
                            <option value="Cash">Cash (Offline)</option>
                            <option value="UPI">UPI (GPay/PhonePe)</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Advance Months</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={paymentModal.months}
                                onChange={handleMonthsChange} 
                                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Amount (INR)</label>
                            <input 
                                type="number" 
                                required 
                                value={paymentModal.amount}
                                onChange={(e) => setPaymentModal(prev => ({...prev, amount: e.target.value}))}
                                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-green-500 outline-none transition-colors font-mono"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing}
                        className={`w-full py-4 font-bold rounded-xl mt-4 shadow-lg transition-all flex items-center justify-center gap-3
                        ${processing 
                            ? "bg-gray-700 text-gray-300 cursor-not-allowed opacity-100" // Grey when processing
                            : "bg-gradient-to-r from-green-600 to-green-500 text-black hover:from-green-500 hover:to-green-400 hover:scale-[1.02] shadow-green-500/20"
                        }`}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" /> 
                                <span>Processing...</span>
                            </>
                        ) : (
                            "Confirm & Update Record"
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 2. HISTORY MODAL */}
      <AnimatePresence>
      {historyModal.open && (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-xl"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#050505] border border-gray-800 w-full max-w-4xl h-[85vh] rounded-3xl shadow-[0_0_60px_-15px_rgba(124,58,237,0.3)] relative overflow-hidden flex flex-col"
            >
                <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]"></div>

                <div className="p-8 flex justify-between items-start bg-white/5 border-b border-white/5 relative">
                    <div className="flex gap-6 items-center z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                            <User className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-1">{historyModal.student?.user?.name}</h2>
                            <p className="text-gray-400 text-sm">{historyModal.student?.user?.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setHistoryModal({open:false, history:[], student: null})} className="p-2 bg-white/5 hover:bg-white/10 rounded-full"><X className="text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
                    <div className="space-y-6 relative ml-4">
                        {historyModal.history?.length > 0 ? (
                            historyModal.history.slice().map((txn, idx) => (
                                <div key={idx} className="bg-[#121212] border border-white/5 p-5 rounded-2xl flex justify-between items-center gap-4">
                                    <div>
                                        <h4 className="text-white font-bold text-lg">₹ {txn.amount}</h4>
                                        <p className="text-xs text-yellow-500 font-bold uppercase mt-1 tracking-wide">{txn.month}</p>
                                        <p className="text-xs text-gray-500 mt-1">{txn.method || 'Online'} • {new Date(txn.date).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => generateInvoice(historyModal.student, txn)}
                                        className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
                                    >
                                        Invoice
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No history.</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}

// Helper Components
const StatCard = ({ icon, title, value, color }) => (
    <div className={`p-6 rounded-2xl border ${color} flex items-center gap-4 hover:bg-white/5 transition-colors`}>
        <div className="p-3 bg-black/40 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = { 
        "Paid": "text-green-400 bg-green-500/10 border-green-500/20", 
        "Pending": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", 
        "Blocked": "text-red-400 bg-red-500/10 border-red-500/20",
        "Overdue": "text-orange-400 bg-orange-500/10 border-orange-500/20"
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles["Pending"]}`}>{status}</span>;
};