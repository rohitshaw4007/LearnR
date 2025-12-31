"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    activeEnrollments: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch Stats & Enrollments
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Parallel Fetching for Speed
      const [statsRes, enrollRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/enrollments")
      ]);

      const statsData = await statsRes.json();
      const enrollData = await enrollRes.json();

      if (statsRes.ok) setStats(statsData);
      // Ensure enrollments is an array
      setEnrollments(enrollData.enrollments || []);
      
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch("/api/admin/enrollments/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: id, action }),
      });

      if (res.ok) {
        // Remove from list locally if success and update stats slightly
        setEnrollments((prev) => prev.filter((e) => e._id !== id));
        // Optional: Refetch stats to get updated numbers
        fetchAllData(); 
        alert(`Request ${action}ed successfully!`);
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    { 
      title: "Total Revenue", 
      value: formatCurrency(stats.totalRevenue), 
      icon: DollarSign, 
      color: "text-green-400", 
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      desc: "Lifetime earnings"
    },
    { 
      title: "Total Students", 
      value: stats.totalStudents, 
      icon: Users, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      desc: "Registered users"
    },
    { 
      title: "Total Courses", 
      value: stats.totalCourses, 
      icon: BookOpen, 
      color: "text-yellow-400", 
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      desc: "Active curriculum"
    },
    { 
      title: "Pending Requests", 
      value: stats.pendingRequests, 
      icon: AlertCircle, 
      color: "text-red-400", 
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      desc: "Action required"
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <button 
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/10 rounded-full text-xs text-gray-400 hover:text-white hover:border-yellow-500/50 transition-all"
        >
            <Activity size={14} /> Refresh Data
        </button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
                relative overflow-hidden p-6 rounded-3xl border ${stat.border} 
                bg-[#0A0A0A] hover:-translate-y-1 transition-transform duration-300
            `}
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none`}></div>

            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-gray-400`}>
                 +2.5% 
              </span>
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-black text-white tracking-tight">{loading ? "..." : stat.value}</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">{stat.title}</p>
                <p className="text-gray-600 text-xs mt-4 pt-4 border-t border-white/5 flex items-center gap-1">
                   {stat.desc}
                </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- RECENT PENDING ENROLLMENTS --- */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-full"></span>
                Enrollment Requests
            </h2>
            <span className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {enrollments.length} Pending
            </span>
         </div>

         {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1,2,3].map(i => (
                     <div key={i} className="h-40 rounded-2xl bg-[#111] animate-pulse"></div>
                 ))}
             </div>
         ) : enrollments.length === 0 ? (
             <div className="p-12 border border-dashed border-white/10 rounded-3xl bg-[#050505] text-center">
                <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-white font-bold text-lg">All Caught Up!</h3>
                <p className="text-gray-500 mt-1">There are no pending enrollment requests right now.</p>
             </div>
         ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {enrollments.map((req, i) => (
                   <motion.div 
                      key={req._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="group relative bg-[#0F0F0F] border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-yellow-500/30 transition-all overflow-hidden"
                   >
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                      {/* User Info */}
                      <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
                         <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                            {req.user?.name?.[0] || "U"}
                         </div>
                         <div>
                            <h4 className="font-bold text-white text-lg">{req.user?.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                               <span className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-0.5 rounded border border-white/5">
                                 {req.transactionId}
                               </span>
                               <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                 Pending
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Course Info */}
                      <div className="relative z-10 text-left md:text-center w-full md:w-auto">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Applying For</p>
                          <h5 className="font-bold text-white">{req.course?.title}</h5>
                          <p className="text-sm text-green-400 font-mono mt-0.5">₹{req.amount} Paid</p>
                      </div>

                      {/* Date */}
                      <div className="relative z-10 text-left md:text-right hidden md:block">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Date</p>
                          <p className="text-sm text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-600">{new Date(req.createdAt).toLocaleTimeString()}</p>
                      </div>

                      {/* Actions */}
                      <div className="relative z-10 flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                         <button 
                            onClick={() => handleAction(req._id, "reject")}
                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-red-400 border border-white/5 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                         >
                            <XCircle size={18} /> <span className="md:hidden lg:inline">Reject</span>
                         </button>
                         <button 
                            onClick={() => handleAction(req._id, "approve")}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center justify-center gap-2 text-sm transform active:scale-95"
                         >
                            <CheckCircle size={18} /> <span>Approve Access</span>
                         </button>
                      </div>
                   </motion.div>
                ))}
              </AnimatePresence>
            </div>
         )}
      </div>
    </div>
  );
}