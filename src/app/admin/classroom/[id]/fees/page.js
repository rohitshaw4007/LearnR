"use client";
import { useState, useEffect, use } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  Download, Search, RefreshCcw, DollarSign, Users, AlertTriangle, CheckCircle, FileText, Ban 
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export default function FeeManagementPage({ params }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ stats: {}, students: [], graphData: [] });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Modal States
  const [paymentModal, setPaymentModal] = useState({ open: false, student: null });
  const [historyModal, setHistoryModal] = useState({ open: false, history: [] });

  // --- 1. Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${id}/fees?month=${selectedMonth}-01`);
      const result = await res.json();
      
      setData(result);
      setFilteredStudents(result.students);
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, selectedMonth]);

  // --- 2. Filter Logic ---
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(data.students);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents(
        data.students.filter(s => 
          s.user.name.toLowerCase().includes(lower) || 
          s.user.email.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, data.students]);

  // --- 3. Manual Payment Logic ---
  const handleManualPayment = async (amount) => {
    if (!paymentModal.student) return;
    
    try {
        const res = await fetch(`/api/admin/courses/${id}/fees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                enrollmentId: paymentModal.student._id,
                amount: amount,
                mode: "Cash/Manual"
            })
        });
        
        const response = await res.json();
        if (response.success) {
            alert("Payment Successful! User notified.");
            setPaymentModal({ open: false, student: null });
            fetchData(); // Refresh Data
        } else {
            alert(response.error);
        }
    } catch (error) {
        alert("Payment Failed");
    }
  };

  // --- 4. Generate Invoice PDF ---
  const generateInvoice = (student, transaction) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(63, 81, 181); // Blue header
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("INVOICE / RECEIPT", 105, 25, null, null, "center");

    // Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Invoice To: ${student.user.name}`, 20, 60);
    doc.text(`Email: ${student.user.email}`, 20, 70);
    doc.text(`Date: ${new Date(transaction.date).toLocaleDateString()}`, 140, 60);
    doc.text(`Receipt #: ${transaction.transactionId.slice(-8)}`, 140, 70);

    // Table
    doc.autoTable({
      startY: 90,
      head: [['Description', 'Month', 'Mode', 'Amount']],
      body: [
        ['Course Fee Payment', transaction.month, transaction.method || 'Online', `Rs. ${transaction.amount}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 150, null, null, "center");
    
    doc.save(`Invoice_${student.user.name}_${transaction.date}.pdf`);
  };

  // --- 5. Export to Excel ---
  const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
        Name: s.user.name,
        Email: s.user.email,
        Status: s.status,
        NextDue: format(new Date(s.nextDue), 'yyyy-MM-dd'),
        TotalPaid: s.paymentHistory.reduce((a, b) => a + b.amount, 0)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fees");
    XLSX.writeFile(wb, "Fee_Report.xlsx");
  };

  // --- GRAPH COLORS ---
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading && !data.students.length) return <div className="p-10 text-white">Loading Financial Data...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Fee Management Console
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage payments, invoices, and subscription status.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button onClick={exportData} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all">
                <Download size={18} /> Export Data
            </button>
        </div>
      </div>

      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign className="text-green-400" />} title="Revenue (This Month)" value={`₹${data.stats.totalRevenue || 0}`} color="bg-green-900/20 border-green-800" />
        <StatCard icon={<CheckCircle className="text-blue-400" />} title="Paid Students" value={data.stats.paidCount || 0} color="bg-blue-900/20 border-blue-800" />
        <StatCard icon={<AlertTriangle className="text-yellow-400" />} title="Pending / Overdue" value={data.stats.pendingCount || 0} color="bg-yellow-900/20 border-yellow-800" />
        <StatCard icon={<Ban className="text-red-400" />} title="Blocked Users" value={data.stats.blockedCount || 0} color="bg-red-900/20 border-red-800" />
      </div>

      {/* 2. GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                        <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* Status Pie Chart */}
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 w-full text-left">Fee Status Distribution</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Paid', value: data.stats.paidCount },
                                { name: 'Pending', value: data.stats.pendingCount },
                                { name: 'Blocked', value: data.stats.blockedCount },
                            ]}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                        >
                            {/* Colors: Paid=Blue, Pending=Yellow, Blocked=Red */}
                            <Cell fill="#3B82F6" />
                            <Cell fill="#EAB308" />
                            <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111827' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Paid</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Pending</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Blocked</span>
            </div>
        </div>
      </div>

      {/* 3. STUDENT TABLE & CONTROLS */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-purple-400" /> Student Fee List
            </h3>
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search user..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none w-full sm:w-64"
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Next Due Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {filteredStudents.map((enroll) => (
                        <tr key={enroll._id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="p-4">
                                <p className="font-semibold text-white">{enroll.user.name}</p>
                                <p className="text-xs text-gray-500">{enroll.user.email}</p>
                            </td>
                            <td className="p-4 text-sm text-gray-300">
                                {new Date(enroll.nextDue).toDateString()}
                            </td>
                            <td className="p-4">
                                <StatusBadge status={enroll.status} />
                            </td>
                            <td className="p-4 flex items-center justify-center gap-2">
                                {/* Manual Pay Button */}
                                <button 
                                    onClick={() => setPaymentModal({ open: true, student: enroll })}
                                    title="Manual Payment"
                                    className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    <DollarSign size={16} />
                                </button>
                                
                                {/* History Button */}
                                <button 
                                    onClick={() => setHistoryModal({ open: true, history: enroll.paymentHistory, user: enroll.user })}
                                    title="View History"
                                    className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                                >
                                    <FileText size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No students found matching your search.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. MANUAL PAYMENT MODAL */}
      {paymentModal.open && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#121212] border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Manual Payment Entry</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Recording payment for <span className="text-white font-semibold">{paymentModal.student?.user.name}</span>.
                    This will unblock the user and extend validity by 1 month.
                </p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleManualPayment(e.target.amount.value);
                }}>
                    <label className="block text-xs text-gray-500 mb-2">Amount Received (Cash/UPI)</label>
                    <input name="amount" type="number" required placeholder="e.g. 500" className="w-full bg-black border border-gray-700 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-green-500 outline-none" />
                    
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setPaymentModal({open:false, student:null})} className="flex-1 py-3 bg-gray-800 rounded-lg font-semibold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white">Confirm Payment</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* 2. HISTORY & INVOICE MODAL */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#121212] border border-gray-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Payment History</h3>
                    <button onClick={() => setHistoryModal({open:false, history:[]})} className="text-gray-400 hover:text-white">Close</button>
                </div>
                
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Txn ID</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {historyModal.history.slice().reverse().map((txn, idx) => (
                            <tr key={idx}>
                                <td className="p-3 text-gray-300">{new Date(txn.date).toLocaleDateString()}</td>
                                <td className="p-3 text-green-400 font-mono">₹{txn.amount}</td>
                                <td className="p-3 text-xs text-gray-500 font-mono">{txn.transactionId}</td>
                                <td className="p-3 text-xs text-gray-400">{txn.method || 'Online'}</td>
                                <td className="p-3">
                                    <button 
                                        onClick={() => generateInvoice({ user: historyModal.user }, txn)}
                                        className="text-blue-400 hover:underline flex items-center gap-1 text-xs"
                                    >
                                        <Download size={12} /> PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {historyModal.history.length === 0 && <p className="text-center text-gray-500 py-4">No history found.</p>}
            </div>
        </div>
      )}

    </div>
  );
}

// Helper Components
const StatCard = ({ icon, title, value, color }) => (
    <div className={`p-6 rounded-2xl border ${color} flex items-center gap-4`}>
        <div className="p-3 bg-black/40 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        "Paid": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "Overdue": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        "Blocked": "bg-red-500/10 text-red-400 border-red-500/20"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles["Paid"]}`}>
            {status}
        </span>
    );
};