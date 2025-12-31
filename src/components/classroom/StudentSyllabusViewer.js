"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, PlayCircle, BookOpen, Layers, Trophy
} from "lucide-react";

export default function StudentSyllabusViewer({ courseId }) {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Syllabus (Student API se)
  const fetchSyllabus = async () => {
    try {
      // Dhyan de: URL ab '/api/courses/...' hai, admin wala nahi
      const res = await fetch(`/api/courses/${courseId}/syllabus`);
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

  const getStatusColor = (status) => {
    switch(status) {
      case "Completed": return "text-green-400 bg-green-500/10 border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]";
      case "Ongoing": return "text-yellow-300 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen text-white">
      
      {/* Header with Stats */}
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
                <span className="text-xs font-bold text-white">{stats.progress}% Completed</span>
             </div>
          </div>
        </div>
      </div>

      {/* GRAPHICAL TIMELINE DISPLAY */}
      <div className="relative ml-2 md:ml-8 space-y-4 md:space-y-6 pb-20">
        {loading ? (
            <div className="pl-8 text-sm text-gray-500 animate-pulse">Loading Syllabus...</div>
        ) : syllabus.length === 0 ? (
            <p className="pl-8 text-sm text-gray-500 italic">Syllabus content coming soon.</p>
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

                {/* COMPACT CARD */}
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

                  {/* Details Grid */}
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

                </div>
              </motion.div>
            );
         })
        )}
      </div>
    </div>
  );
}