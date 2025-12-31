"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MonitorPlay, Users, Mic, ChevronRight, RefreshCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminClassroomList() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Error state add kiya
  const router = useRouter();

  // Function to fetch courses
  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses");
      
      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        setCourses([]);
        console.warn("API returned non-array data:", data);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Could not load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c => 
    (c.title?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-12 mt-2 md:mt-0 flex justify-between items-end">
            <div>
                <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight mb-1 md:mb-2 flex items-center gap-2">
                <span className="text-yellow-400">Live</span> Classroom
                </h1>
                <p className="text-xs md:text-base text-gray-400">Select a course to start streaming.</p>
            </div>
            {/* Refresh Button */}
            <button 
                onClick={fetchCourses} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                title="Refresh List"
            >
                <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 md:mb-10 group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-[#111] border border-white/10 rounded-xl md:rounded-2xl p-1 flex items-center">
            <div className="pl-3 pr-2 md:pl-4 md:pr-3 text-gray-500"><Search size={18} className="md:w-5 md:h-5"/></div>
            <input 
              type="text" 
              placeholder="Search classrooms..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-600 py-2 md:py-3 outline-none border-none font-medium text-sm md:text-base"
            />
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        
        {/* 1. ERROR STATE */}
        {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111] border border-red-500/20 rounded-2xl">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <h3 className="text-lg font-bold text-white">Oops! Something went wrong.</h3>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button 
                    onClick={fetchCourses}
                    className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                    Try Again
                </button>
            </div>
        )}

        {/* 2. LOADING STATE (Skeletons) */}
        {!error && isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-24 md:h-48 bg-[#111] border border-white/5 animate-pulse rounded-2xl md:rounded-3xl flex items-center p-4">
                    <div className="w-16 h-16 bg-white/5 rounded-xl mr-4"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-3/4"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                 </div>
               ))}
            </div>
        )}

        {/* 3. EMPTY STATE (Loaded but no courses) */}
        {!error && !isLoading && filteredCourses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <MonitorPlay size={48} className="mb-4 text-gray-600" />
                <p className="text-gray-400 font-medium">No classrooms found.</p>
                <p className="text-xs text-gray-600 mt-1">Create a course in the "Courses" tab first.</p>
            </div>
        )}

        {/* 4. SUCCESS STATE (Course Grid) */}
        {!error && !isLoading && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <AnimatePresence>
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/admin/classroom/${course._id}`)}
                    className="group cursor-pointer bg-[#0a0a0a] border border-white/10 hover:border-yellow-400/50 rounded-2xl md:rounded-3xl overflow-hidden relative flex flex-row md:flex-col h-24 md:h-auto items-center md:items-stretch shadow-lg"
                  >
                    {/* Icon/Gradient Area */}
                    <div className={`w-24 md:w-full h-full md:h-32 bg-gradient-to-br ${course.gradient || 'from-gray-800 to-black'} p-0 md:p-6 relative flex items-center justify-center md:block shrink-0`}>
                        <div className="md:hidden">
                            <MonitorPlay size={24} className="text-white/80" />
                        </div>
                        <div className="hidden md:block absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
                        <span className="hidden md:inline-block relative z-10 bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-white uppercase">
                            {course.category || "General"}
                        </span>
                        <div className="hidden md:flex absolute bottom-4 right-4 bg-white/10 backdrop-blur p-2 rounded-full text-white group-hover:bg-yellow-400 group-hover:text-black transition-colors shadow-lg">
                            <MonitorPlay size={20} fill="currentColor" />
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-3 md:p-6 flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                 <span className="md:hidden text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 block">
                                    {course.category || "Course"}
                                 </span>
                                 <h3 className="text-sm md:text-xl font-bold text-white leading-tight truncate md:mb-2 group-hover:text-yellow-400 transition-colors">
                                    {course.title}
                                 </h3>
                            </div>
                            <ChevronRight size={18} className="text-gray-600 md:hidden ml-2" />
                        </div>

                        <div className="hidden md:flex items-center gap-4 text-gray-500 text-sm mt-4">
                            <div className="flex items-center gap-1.5">
                                <Users size={14} /> <span>Students Enrolled</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-green-400/80">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> <span>Ready</span>
                            </div>
                        </div>
                        
                        <div className="hidden md:flex mt-6 pt-4 border-t border-white/5 justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Tap to enter</span>
                            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                                 START CLASS <Mic size={12} />
                            </span>
                        </div>

                        <div className="md:hidden flex items-center gap-2 mt-1">
                             <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Live Ready
                             </div>
                        </div>
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