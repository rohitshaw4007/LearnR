"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, CheckCircle2, Clock, 
  PlayCircle, BookOpen, Layers, Hash, X, Trophy
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function SyllabusManager({ courseId }) {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    chapterNo: "",
    chapterName: "",
    bookName: "",
    topicName: "",
    status: "Pending"
  });

  // Suggestion State
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);

  // Fetch Syllabus
  const fetchSyllabus = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/syllabus`);
      const data = await res.json();
      if (res.ok) setSyllabus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
        fetchSyllabus();
    }
  }, [courseId]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = syllabus.length;
    const completed = syllabus.filter(s => s.status === "Completed").length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [syllabus]);

  // Derived Unique Lists for Suggestions
  const bookSuggestions = useMemo(() => 
    [...new Set(syllabus.map(s => s.bookName).filter(Boolean))], 
  [syllabus]);

  const topicSuggestions = useMemo(() => 
    [...new Set(syllabus.map(s => s.topicName).filter(Boolean))], 
  [syllabus]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `/api/admin/syllabus/${editingId}`
      : `/api/admin/courses/${courseId}/syllabus`;
    
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Chapter Updated!" : "Chapter Added!");
        fetchSyllabus();
        closeForm();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save chapter");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ chapterNo: "", chapterName: "", bookName: "", topicName: "", status: "Pending" });
  };

  const handleEdit = (item) => {
    setFormData({
        chapterNo: item.chapterNo,
        chapterName: item.chapterName,
        bookName: item.bookName,
        topicName: item.topicName,
        status: item.status
    });
    setEditingId(item._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/syllabus/${id}`, { method: "DELETE" });
      setSyllabus(prev => prev.filter(p => p._id !== id));
      toast.success("Deleted!");
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Completed": return "text-green-400 bg-green-500/10 border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]";
      case "Ongoing": return "text-yellow-300 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen text-white">
      
      {/* Header with Stats & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
        
        {/* Title & Progress */}
        <div className="w-full md:w-auto">
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
            Course Syllabus
          </h2>
          
          <div className="mt-3 flex items-center gap-4">
             {/* Progress Bar Compact */}
             <div className="bg-[#111] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 w-full md:w-auto">
                <Trophy size={14} className="text-green-400" />
                <div className="w-24 md:w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                   <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${stats.progress}%` }} 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-300"
                   />
                </div>
                <span className="text-xs font-bold text-white">{stats.progress}%</span>
             </div>
          </div>
        </div>

        {/* Add Button - Compact & Clean */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(true)}
          className="bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.3)] transition-all text-sm self-end md:self-auto"
        >
          <Plus size={18} strokeWidth={3} /> Add Chapter
        </motion.button>
      </div>

      {/* GRAPHICAL TIMELINE DISPLAY */}
      <div className="relative ml-2 md:ml-8 space-y-4 md:space-y-6 pb-20">
        {loading ? (
            <div className="pl-8 text-sm text-gray-500 animate-pulse">Loading Roadmap...</div>
        ) : syllabus.length === 0 ? (
            <p className="pl-8 text-sm text-gray-500 italic">No chapters added yet.</p>
        ) : (
         syllabus.map((item, index) => {
            const isLast = index === syllabus.length - 1;
            
            // Neon Line Logic
            let lineClass = "border-l-2 border-dashed border-white/10";
            let lineGlow = "";

            if (item.status === "Completed") {
                lineClass = "border-l-2 border-solid border-green-500";
                lineGlow = "shadow-[0_0_10px_rgba(34,197,94,0.5)]";
            } else if (item.status === "Ongoing") {
                lineClass = "border-l-2 border-solid border-yellow-400";
            }

            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item._id} 
                className="relative pl-8 md:pl-12 group"
              >
                {/* Timeline Line */}
                {!isLast && (
                   <div className={`absolute left-0 top-[18px] h-[calc(100%+1rem)] w-[2px] z-0 ${lineClass} ${lineGlow}`}>
                      {item.status === "Ongoing" && (
                         <div className="absolute inset-0 w-full h-full bg-yellow-400 blur-[3px] animate-pulse" />
                      )}
                   </div>
                )}

                {/* Dot */}
                <div className={`absolute -left-[7px] top-6 w-4 h-4 rounded-full border-[3px] border-[#050505] z-10 transition-colors duration-500
                  ${item.status === "Completed" ? "bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]" : 
                    item.status === "Ongoing" ? "bg-yellow-400 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.8)]" : 
                    "bg-gray-700"}`} 
                />

                {/* COMPACT CARD - Slimmer & Sleeker */}
                <div className={`relative bg-[#0f0f0f]/80 backdrop-blur-md border border-white/5 p-4 md:p-5 rounded-xl 
                    transition-all duration-300 hover:bg-[#141414] hover:border-white/10 group-hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]`}
                >
                  
                  {/* Header Row */}
                  <div className="flex items-center gap-4 mb-3">
                     {/* Chapter No */}
                     <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent select-none leading-none">
                        #{String(item.chapterNo).padStart(2,'0')}
                     </span>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h3 className="text-base md:text-lg font-bold text-white group-hover:text-yellow-300 transition-colors truncate">
                                {item.chapterName}
                            </h3>
                             {/* Status Badge */}
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit border ${getStatusColor(item.status)}`}>
                                {item.status === "Completed" && <CheckCircle2 size={10} />}
                                {item.status === "Ongoing" && <PlayCircle size={10} className="animate-spin-slow" />}
                                {item.status}
                            </div>
                        </div>
                     </div>
                  </div>

                  {/* Details Grid - Slim */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                         <BookOpen size={14} className="text-blue-400"/>
                         <span className="truncate">{item.bookName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Layers size={14} className="text-purple-400"/>
                         <span className="truncate">{item.topicName}</span>
                      </div>
                  </div>

                  {/* Actions (Always visible on mobile but subtle) */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-blue-400 rounded-lg transition-colors">
                        <Edit2 size={14}/>
                     </button>
                     <button onClick={() => handleDelete(item._id)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={14}/>
                     </button>
                  </div>

                </div>
              </motion.div>
            );
         })
        )}
      </div>

      {/* COMPACT CENTERED FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Overlay */}
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
               onClick={closeForm}
            />
            {/* Modal Box - Centered & Sized Correctly */}
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
                >
                  {/* Modal Header */}
                  <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111]">
                      <h3 className="text-lg font-bold text-white">{editingId ? "Edit Chapter" : "New Chapter"}</h3>
                      <button onClick={closeForm} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400"><X size={18}/></button>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="p-5 overflow-y-auto custom-scrollbar">
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-20">
                               <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">No.</label>
                               <input type="number" required placeholder="01" 
                                    className="w-full bg-[#111] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-yellow-400 text-center font-mono text-sm outline-none"
                                    value={formData.chapterNo} onChange={e => setFormData({...formData, chapterNo: e.target.value})}
                               />
                            </div>
                            <div className="flex-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Chapter Name</label>
                               <input type="text" required placeholder="Physics Intro..." 
                                  className="w-full bg-[#111] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-yellow-400 text-sm outline-none"
                                  value={formData.chapterName} onChange={e => setFormData({...formData, chapterName: e.target.value})}
                               />
                            </div>
                        </div>

                        {/* Smart Inputs */}
                        <div className="space-y-4">
                            <div className="relative">
                               <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Book Name</label>
                               <BookOpen size={14} className="absolute left-3 top-[26px] text-gray-600"/>
                               <input type="text" required placeholder="HC Verma..." 
                                  className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-white focus:border-yellow-400 text-sm outline-none"
                                  value={formData.bookName}
                                  onFocus={() => setShowBookSuggestions(true)}
                                  onBlur={() => setTimeout(() => setShowBookSuggestions(false), 200)}
                                  onChange={e => setFormData({...formData, bookName: e.target.value})}
                               />
                               {showBookSuggestions && bookSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-white/10 mt-1 rounded-lg z-50 max-h-32 overflow-y-auto">
                                        {bookSuggestions.filter(b => b.toLowerCase().includes(formData.bookName.toLowerCase())).map(book => (
                                            <div key={book} onClick={() => setFormData({...formData, bookName: book})} className="px-3 py-2 hover:bg-white/5 text-xs text-gray-300 cursor-pointer">{book}</div>
                                        ))}
                                    </div>
                               )}
                            </div>

                            <div className="relative">
                               <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Topic</label>
                               <Layers size={14} className="absolute left-3 top-[26px] text-gray-600"/>
                               <input type="text" required placeholder="Mechanics..." 
                                  className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-white focus:border-yellow-400 text-sm outline-none"
                                  value={formData.topicName}
                                  onFocus={() => setShowTopicSuggestions(true)}
                                  onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 200)}
                                  onChange={e => setFormData({...formData, topicName: e.target.value})}
                               />
                               {showTopicSuggestions && topicSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-white/10 mt-1 rounded-lg z-50 max-h-32 overflow-y-auto">
                                        {topicSuggestions.filter(t => t.toLowerCase().includes(formData.topicName.toLowerCase())).map(topic => (
                                            <div key={topic} onClick={() => setFormData({...formData, topicName: topic})} className="px-3 py-2 hover:bg-white/5 text-xs text-gray-300 cursor-pointer">{topic}</div>
                                        ))}
                                    </div>
                               )}
                            </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Status</label>
                           <select 
                              value={formData.status} 
                              onChange={e => setFormData({...formData, status: e.target.value})}
                              className="w-full bg-[#111] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-yellow-400 text-sm outline-none appearance-none cursor-pointer"
                           >
                              <option value="Pending">Pending ⏳</option>
                              <option value="Ongoing">Ongoing ▶️</option>
                              <option value="Completed">Completed ✅</option>
                           </select>
                        </div>

                        <button type="submit" className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20 text-sm mt-4">
                           {editingId ? "Update Chapter" : "Add Chapter"}
                        </button>
                     </form>
                  </div>
                </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}