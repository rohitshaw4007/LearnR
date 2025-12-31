"use client";
import { useState, useEffect } from "react";
import { 
  CreditCard, Calendar, Clock, Download, CheckCircle, AlertTriangle, 
  ShieldCheck, Zap, Loader2, Lock, Hourglass 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function StudentFeeManagement({ courseId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Payment State
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Debug Helper
  const debug = (msg, val) => console.log(`%c[FEE_UI] ${msg}`, "color: yellow", val || "");

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

  // 1. Fetch Fee Data
  const fetchFees = async () => {
    try {
      setLoading(true);
      debug("Fetching fees for course:", courseId);
      const res = await fetch(`/api/courses/${courseId}/my-fees`);
      if (res.ok) {
        const json = await res.json();
        debug("Fee Data Received:", json);
        setData(json);
      } else {
        debug("Fetch failed status:", res.status);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchFees();
  }, [courseId]);

  // 2. Handle Payment (Razorpay)
  const handlePayment = async (isAdvance = false) => {
    if (!data) return;
    setProcessing(true);

    try {
        const monthsToPay = isAdvance ? advanceMonths : 1;
        const amountToPay = data.monthlyFee * monthsToPay; 
        
        // Base Date Logic: Always strictly use nextDue from backend
        let baseDate = data.nextDue ? new Date(data.nextDue) : new Date();
        
        // If overdue (baseDate is in past), logic remains same: 
        // Payment clears the backlog starting from that past date.
        
        const billingCycle = getTargetMonths(baseDate, monthsToPay);
        debug("Initiating Payment:", { monthsToPay, amountToPay, billingCycle });

        // A. Create Order
        const orderRes = await fetch("/api/payment/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId: courseId,
                months: monthsToPay, 
                note: `Fee: ${billingCycle}` 
            })
        });
        
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error);

        // B. Open Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderData.order.amount, 
            currency: "INR",
            name: "LearnR Education",
            description: `Payment for ${billingCycle}`, 
            order_id: orderData.order.id,
            handler: async function (response) {
                debug("Razorpay Success. Verifying...");
                // C. Verify Payment
                const verifyRes = await fetch("/api/payment/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        // userId is now handled by token in backend
                        courseId: courseId,
                        amount: amountToPay
                    })
                });

                const verifyJson = await verifyRes.json();
                if (verifyJson.success) {
                    alert(`Payment Successful for ${billingCycle}!`);
                    setAdvanceMonths(1);
                    fetchFees(); // Refresh Data
                } else {
                    alert("Payment Verification Failed: " + verifyJson.error);
                }
            },
            theme: { color: "#EAB308" },
            prefill: {
                name: data.user?.name,
                email: data.user?.email
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error) {
        alert("Payment Failed: " + error.message);
    } finally {
        setProcessing(false);
    }
  };

  // --- Request Unblock Function ---
  const requestUnblock = async () => {
    try {
        setProcessing(true);
        const res = await fetch(`/api/courses/${courseId}/unblock-request`, {
            method: "POST"
        });
        const json = await res.json();
        
        if (res.ok) {
            alert("Request Sent! Admin will verify shortly.");
            fetchFees(); 
        } else {
            alert(json.error || "Failed to send request");
        }
    } catch (error) {
        alert("Something went wrong");
    } finally {
        setProcessing(false);
    }
  };

  // 3. Generate Invoice
  const downloadInvoice = (txn) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const deepBlack = [10, 10, 10];
    const neonYellow = [255, 220, 0];

    doc.setFillColor(...deepBlack);
    doc.rect(0, 0, pageWidth, 55, "F");
    
    doc.setTextColor(...neonYellow);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("LEARNR", 20, 35);
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL RECEIPT", pageWidth - 20, 35, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Student: ${data.user?.name || 'Student'}`, 20, 70);
    doc.text(`Email: ${data.user?.email || 'N/A'}`, 20, 75);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Txn ID: ${txn.transactionId ? txn.transactionId.slice(-10).toUpperCase() : 'N/A'}`, pageWidth - 20, 70, { align: "right" });
    doc.text(`Date: ${new Date(txn.date).toLocaleDateString()}`, pageWidth - 20, 75, { align: "right" });

    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Billing Period', 'Mode', 'Amount']],
      body: [[
        `Subscription - ${data.courseTitle}`, 
        txn.month || 'Monthly Fee', 
        txn.method || 'Online', 
        `INR ${txn.amount}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: deepBlack, textColor: neonYellow, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { halign: 'center', cellPadding: 6 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(...deepBlack);
    doc.rect(pageWidth - 70, finalY, 50, 15, "F");
    doc.setTextColor(...neonYellow);
    doc.setFontSize(12);
    doc.text(`Total: INR ${txn.amount}`, pageWidth - 25, finalY + 10, { align: "right" });
    doc.save(`Receipt_${txn.transactionId || 'draft'}.pdf`);
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="text-sm font-mono tracking-widest">SYNCING DATA...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-gray-500">Unable to load fee details.</div>;

  const isFeeDue = data.status === "Pending" || data.status === "Overdue" || data.status === "Blocked";
  
  // Display Logic: 'Paid Till'
  const dueMonthName = data.nextDue ? new Date(data.nextDue).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A';
  
  // Advance Calculation
  let advanceStart = data.nextDue ? new Date(data.nextDue) : new Date();
  const advanceRange = getTargetMonths(advanceStart, advanceMonths);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-800 pb-6">
            <div>
                <h2 className="text-3xl font-black text-white mb-2">My Fee Status</h2>
                <p className="text-gray-400 text-sm">Manage your subscription and view payment history.</p>
            </div>
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                data.status === "Paid" ? "border-green-500/30 bg-green-900/10 text-green-400" : 
                data.status === "Overdue" ? "border-red-500/30 bg-red-900/10 text-red-400" :
                "border-yellow-500/30 bg-yellow-900/10 text-yellow-400"
            }`}>
                {data.status === "Paid" ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                <span className="font-bold uppercase text-sm tracking-wide">{data.status}</span>
            </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: PAYMENT ACTION AREA */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Due Date Info Card */}
                <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                             {data.status === 'Paid' ? 'Subscription Active Until' : 'Next Payment Due'}
                        </p>
                        <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                           {new Date(data.nextDue).toDateString()} 
                        </h3>
                        <p className="text-xs text-gray-600 mt-2">
                            {data.status === 'Paid' ? 'You are all set for this month.' : 'Please clear your dues.'}
                        </p>
                    </div>
                    <Calendar className="text-purple-500 w-12 h-12 opacity-50" />
                </div>

                {/* PAYMENT SECTION */}
                <div className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-yellow-400" /> 
                        {isFeeDue ? "Clear Due Payment" : "Extend Validity (Advance)"}
                    </h3>

                    {isFeeDue ? (
                        /* --- CASE A: FEE IS DUE --- */
                        <div>
                            <p className="text-gray-400 text-sm mb-6">
                                Pending fee for: <span className="text-white font-bold">{dueMonthName}</span>. 
                                Please pay to restore/continue access.
                            </p>
                            <div className="flex items-center justify-between bg-red-900/10 border border-red-500/20 p-4 rounded-xl mb-6">
                                <span className="text-red-400 font-bold uppercase text-xs tracking-wider">Total Due</span>
                                <span className="text-2xl font-mono text-white font-bold">₹ {data.monthlyFee}</span>
                            </div>

                            {/* UNBLOCK REQUEST */}
                            {data.status === "Blocked" && (
                                <div className="mb-6 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                                    <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                                        <Lock size={16}/> Account Blocked
                                    </h4>
                                    
                                    {data.unblockRequestStatus === "pending" ? (
                                        <div className="flex items-center gap-3 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 mt-2">
                                            <Hourglass size={18} className="animate-pulse"/>
                                            <span className="text-xs font-bold uppercase tracking-wide">Unblock Verification Pending...</span>
                                        </div>
                                    ) : (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                                Paid offline? Request unblock.
                                            </p>
                                            <button 
                                                onClick={requestUnblock}
                                                disabled={processing}
                                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-sm transition-all border border-gray-600 hover:border-gray-500 flex items-center justify-center gap-2"
                                            >
                                                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <ShieldCheck size={16} />}
                                                Request Unblock
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => handlePayment(false)} 
                                disabled={processing}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                                Pay Now (Due for {dueMonthName})
                            </button>
                        </div>
                    ) : (
                        /* --- CASE B: ADVANCE PAYMENT --- */
                        <div>
                            <p className="text-gray-400 text-sm mb-6">
                                Your account is active till <b>{new Date(data.nextDue).toLocaleDateString()}</b>. 
                                You can pay in advance for upcoming months.
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                                        Paying For: <span className="text-green-400">{advanceRange}</span>
                                    </label>
                                    <div className="p-3 bg-black/40 border border-gray-700 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setAdvanceMonths(Math.max(1, advanceMonths - 1))} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center text-xl transition-colors">-</button>
                                            <span className="text-white font-mono font-bold text-xl w-8 text-center">{advanceMonths}</span>
                                            <button onClick={() => setAdvanceMonths(advanceMonths + 1)} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center text-xl transition-colors">+</button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase">Total</p>
                                            <p className="text-yellow-400 font-bold">₹ {data.monthlyFee * advanceMonths}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto">
                                    <button 
                                        onClick={() => handlePayment(true)} 
                                        disabled={processing}
                                        className="w-full md:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                                        Pay Securely
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <ShieldCheck size={12} className="text-green-500"/> SSL Encrypted Payment via Razorpay
                    </p>
                </div>

            </div>

            {/* RIGHT: HISTORY LIST */}
            <div className="bg-[#111] rounded-3xl border border-gray-800 flex flex-col h-[600px] overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-[#151515] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="text-blue-500" size={18} /> Payment History
                    </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {data.history.length > 0 ? data.history.map((txn, i) => (
                        <div key={i} className="group p-4 rounded-xl bg-black/40 border border-gray-800 hover:border-gray-600 transition-all flex justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-white font-bold text-sm">₹ {txn.amount}</p>
                                    {i === 0 && <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 rounded border border-green-900/50">Latest</span>}
                                </div>
                                <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wide truncate max-w-[150px]" title={txn.month}>{txn.month}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(txn.date).toLocaleDateString()}</p>
                            </div>
                            <button 
                                onClick={() => downloadInvoice(txn)}
                                className="p-2 bg-gray-800 hover:bg-yellow-500 hover:text-black rounded-lg text-gray-400 transition-colors shadow-lg"
                                title="Download Receipt"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            <Clock className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">No transactions found.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
}