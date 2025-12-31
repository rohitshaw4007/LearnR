"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, Plus, X, AlertCircle, Pin, ChevronDown, Check, Send, Hourglass, Calendar, Trash2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast"; 

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

// --- CUSTOM DROPDOWN COMPONENT ---
const CustomSelect = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Select";

  return (
    <div className="relative" ref={ref}>
      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5 block ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#1A1A1A] border ${isOpen ? 'border-yellow-400' : 'border-white/10'} rounded-xl p-3 flex items-center justify-between text-white transition-all duration-200 hover:bg-white/5 active:scale-[0.98]`}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon size={16} className="text-gray-400" />}
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown size={16} className={`text-gray-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 right-0 z-[100] bg-[#222] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 bottom-full mb-2 md:bottom-auto md:top-full md:mt-2"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${value === opt.value ? 'text-yellow-400 bg-yellow-400/5' : 'text-gray-300'}`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check size={14} className="flex-shrink-0"/>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CREATE/EDIT NOTICE MODAL COMPONENT ---
const AddNoticeModal = ({ isOpen, onClose, courseId, onNoticeAdded, noticeToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    durationHours: "24",
  });

  useEffect(() => {
    if (noticeToEdit) {
      setFormData({
        title: noticeToEdit.title,
        content: noticeToEdit.content,
        priority: noticeToEdit.priority,
        durationHours: "24"
      });
    } else {
      setFormData({ title: "", content: "", priority: "medium", durationHours: "24" });
    }
  }, [noticeToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
        toast.error("Please fill all fields");
        return;
    }

    setLoading(true);
    try {
      let url = "/api/admin/notice/create";
      let method = "POST";

      if (noticeToEdit) {
         url = `/api/admin/notice/${noticeToEdit._id}`;
         method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courseId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(noticeToEdit ? "Notice Updated!" : "Notice Posted Successfully!");
        onNoticeAdded();
        onClose();
        if (!noticeToEdit) setFormData({ title: "", content: "", priority: "medium", durationHours: "24" });
      } else {
        toast.error(data.error || "Failed to save notice");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: "100%" }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#0f0f0f] w-full max-w-md relative shadow-2xl sm:rounded-3xl rounded-t-3xl border-t sm:border border-white/10"
      >
        <div className="absolute inset-0 overflow-hidden sm:rounded-3xl rounded-t-3xl pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200" />
             <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/10 blur-[50px] rounded-full" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center justify-between p-5 pb-2">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   {noticeToEdit ? "Edit Notice" : "New Notice"}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                   {noticeToEdit ? "Update details below" : "Notify all students instantly"}
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
                <X size={16}/>
            </button>
            </div>

            <div className="p-5 pt-4 space-y-4">
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5 block ml-1">Title</label>
                <input 
                required
                autoFocus
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:bg-[#1A1A1A] outline-none transition-all text-sm font-medium"
                placeholder="Ex: Class Rescheduled"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
            </div>
            
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5 block ml-1">Details</label>
                <textarea 
                required
                rows={3}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:bg-[#1A1A1A] outline-none resize-none transition-all text-sm leading-relaxed"
                placeholder="What's the update about?"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <CustomSelect 
                    label="Duration (Reset)"
                    value={formData.durationHours}
                    onChange={(val) => setFormData({...formData, durationHours: val})}
                    icon={Clock}
                    options={[
                        { value: "1", label: "1 Hour" },
                        { value: "6", label: "6 Hours" },
                        { value: "12", label: "12 Hours" },
                        { value: "24", label: "1 Day" },
                        { value: "48", label: "2 Days" },
                        { value: "168", label: "7 Days" },
                    ]}
                />
                <CustomSelect 
                    label="Priority"
                    value={formData.priority}
                    onChange={(val) => setFormData({...formData, priority: val})}
                    icon={AlertCircle}
                    options={[
                        { value: "low", label: "Low Info" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "Urgent" },
                    ]}
                />
            </div>

            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-yellow-400/20 mb-2"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                    <>
                    <Send size={18} /> {noticeToEdit ? "Update Notice" : "Post Notice"}
                    </>
                )}
            </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN NOTICE BOARD UI ---
export default function NoticeBoard({ courseId, isAdmin = false }) {
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noticeToEdit, setNoticeToEdit] = useState(null);

  const fetchNotices = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/notices`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (data.success) setNotices(data.notices);
    } catch (error) {
      console.error("Failed to fetch notices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchNotices();
  }, [courseId]);

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
        const res = await fetch(`/api/admin/notice/${id}`, { method: "DELETE" });
        const data = await res.json();
        if(data.success) {
            toast.success("Notice Deleted");
            fetchNotices();
        } else {
            toast.error("Failed to delete");
        }
    } catch(err) {
        toast.error("Error deleting notice");
    }
  };

  const handleEdit = (notice) => {
    setNoticeToEdit(notice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNoticeToEdit(null);
  };

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
          <p className="text-gray-400 mt-1 text-xs md:text-sm">Important announcements for this class.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => { setNoticeToEdit(null); setIsModalOpen(true); }}
            className="w-full md:w-auto bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Add Notice
          </button>
        )}
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-20 text-sm">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-[#111] rounded-3xl border border-white/5 border-dashed">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
              <Bell size={24} />
           </div>
           <p className="text-gray-400 font-medium text-sm">No active notices.</p>
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
                // NOTE: Changed padding to p-3 for mobile, kept md:p-6 for PC
                className={`p-3 md:p-6 rounded-xl border border-white/10 relative overflow-hidden group ${getPriorityStyles(notice.priority)}`}
              >
                 <div className="flex justify-between items-start">
                    <div className="flex-1">
                       {/* Title & Badge */}
                       <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {/* Smaller text for mobile */}
                            <h3 className="text-sm md:text-xl font-bold text-white">{notice.title}</h3>
                            {notice.priority === 'high' && <span className="text-[9px] md:text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgent</span>}
                          </div>
                          
                          {/* Admin Actions */}
                          {isAdmin && (
                            <div className="flex items-center gap-1 md:gap-2">
                                <button 
                                    onClick={() => handleEdit(notice)}
                                    className="p-1.5 md:p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    title="Edit Notice"
                                >
                                    <Pencil size={14} className="md:w-4 md:h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(notice._id)}
                                    className="p-1.5 md:p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Notice"
                                >
                                    <Trash2 size={14} className="md:w-4 md:h-4" />
                                </button>
                            </div>
                          )}
                       </div>
                       
                       {/* Content - Smaller text for mobile */}
                       <p className="text-gray-300 leading-relaxed text-xs md:text-sm whitespace-pre-line mb-3 md:mb-4">{notice.content}</p>
                       
                       {/* Footer with Date & Timer */}
                       <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pt-2 md:pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                              <Calendar size={12} className="md:w-[14px] md:h-[14px]"/>
                              <span>Posted: {formatDateTime(notice.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-yellow-500 bg-yellow-400/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg w-fit">
                              <Hourglass size={12} className="animate-pulse md:w-[14px] md:h-[14px]" />
                              <span className="opacity-70">Auto Delete in:</span>
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

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
            <AddNoticeModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal}
                courseId={courseId}
                onNoticeAdded={fetchNotices}
                noticeToEdit={noticeToEdit}
            />
        )}
      </AnimatePresence>
    </div>
  );
}