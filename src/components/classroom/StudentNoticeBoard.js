"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, AlertCircle, Hourglass, Calendar } from "lucide-react";

// --- COUNTDOWN TIMER COMPONENT ---
const CountdownTimer = ({ expireAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const expiration = new Date(expireAt);
      const diff = expiration - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = "";
      if (days > 0) timeString += `${days}d `;
      timeString += `${hours}h ${minutes}m ${seconds}s`;
      
      setTimeLeft(timeString);
    };

    calculateTime();
    const timerId = setInterval(calculateTime, 1000);

    return () => clearInterval(timerId);
  }, [expireAt]);

  return <span className="font-mono font-bold tracking-wide">{timeLeft}</span>;
};

// --- HELPER: FORMAT DATE & TIME ---
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', 
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function StudentNoticeBoard({ courseId }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      // Student API call
      const res = await fetch(`/api/courses/${courseId}/notices`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchNotices();
    // Auto-refresh every 60 seconds to check for expirations locally
    const interval = setInterval(fetchNotices, 60000);
    return () => clearInterval(interval);
  }, [courseId]);

  const getPriorityStyles = (p) => {
    switch(p) {
      case 'high': return "border-l-4 border-l-red-500 bg-red-500/5";
      case 'low': return "border-l-4 border-l-blue-500 bg-blue-500/5";
      default: return "border-l-4 border-l-yellow-400 bg-yellow-400/5";
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto min-h-[500px]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
             <Bell className="text-yellow-400 fill-yellow-400 w-6 h-6 md:w-8 md:h-8" /> Notice Board
          </h2>
          <p className="text-gray-400 mt-1 text-xs md:text-sm">Stay updated with important announcements.</p>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-20 text-sm">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-[#111] rounded-3xl border border-white/5 border-dashed">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
              <Bell size={24} />
           </div>
           <p className="text-gray-400 font-medium text-sm">No active notices.</p>
           <p className="text-gray-600 text-xs mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <AnimatePresence>
            {notices.map((notice) => (
              <motion.div
                key={notice._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-3 md:p-6 rounded-xl border border-white/10 relative overflow-hidden group ${getPriorityStyles(notice.priority)}`}
              >
                 <div className="flex justify-between items-start">
                    <div className="flex-1">
                       {/* Title & Badge */}
                       <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm md:text-xl font-bold text-white">{notice.title}</h3>
                          {notice.priority === 'high' && <span className="text-[9px] md:text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgent</span>}
                       </div>
                       
                       {/* Content */}
                       <p className="text-gray-300 leading-relaxed text-xs md:text-sm whitespace-pre-line mb-3 md:mb-4">{notice.content}</p>
                       
                       {/* Footer with Date & Timer */}
                       <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pt-2 md:pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                              <Calendar size={12} className="md:w-[14px] md:h-[14px]"/>
                              <span>Posted: {formatDateTime(notice.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-yellow-500 bg-yellow-400/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg w-fit">
                              <Hourglass size={12} className="animate-pulse md:w-[14px] md:h-[14px]" />
                              <span className="opacity-70">Expires in:</span>
                              <CountdownTimer expireAt={notice.expireAt} />
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}