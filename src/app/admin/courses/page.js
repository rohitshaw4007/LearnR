"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BookOpen, Layers } from "lucide-react";
import { useRouter } from "next/navigation"; // Router import kiya
import CourseForm from "@/components/admin/CourseForm";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Initialize router

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
      else setCourses([]);
    } catch (err) {
      console.error("Failed to load courses", err);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = Array.isArray(courses) ? courses.filter(c => 
    (c.title?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (c.category?.toLowerCase() || "").includes(search.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Decor (Same as before) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        
        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-6 md:mb-10 flex flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2 md:gap-3 tracking-tight">
              <span className="p-1.5 md:p-2 bg-yellow-400 rounded-lg text-black"><BookOpen size={20} className="md:w-7 md:h-7"/></span>
              Course Manager
            </h1>
            <p className="hidden md:block text-gray-400 mt-2 text-sm font-medium ml-1">Manage, Edit & Create your learning content.</p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsFormOpen(true); }}
            className="hidden md:flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-3.5 rounded-full shadow-[0_0_20px_-5px_rgba(250,204,21,0.5)] transition-all font-bold text-sm tracking-wide"
          >
            <Plus size={18} strokeWidth={3} /> CREATE COURSE
          </motion.button>
        </div>

        {/* Mobile FAB */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => { setIsFormOpen(true); }}
          className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-yellow-400 text-black rounded-full shadow-[0_4px_20px_rgba(250,204,21,0.4)] flex items-center justify-center"
        >
           <Plus size={28} strokeWidth={3} />
        </motion.button>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto mb-6 md:mb-10 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl p-1 flex items-center shadow-2xl">
            <div className="pl-3 md:pl-4 pr-2 md:pr-3 text-gray-500">
                <Search size={18} className="md:w-5 md:h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-600 py-2 md:py-3 outline-none border-none font-medium text-sm md:text-base"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5, scale: 1.02 }} // Hover effect badhaya
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/admin/courses/${course._id}`)} // Redirect logic
                className="cursor-pointer group relative bg-[#111] border border-white/10 hover:border-yellow-400/50 rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-[0_10px_40px_-10px_rgba(250,204,21,0.15)] transition-all duration-300 flex flex-row md:flex-col h-28 md:h-full"
              >
                {/* Image/Gradient Area */}
                <div className={`w-28 md:w-full h-full md:h-40 bg-gradient-to-br ${course.gradient || 'from-gray-800 to-black'} relative p-3 md:p-6 flex flex-col justify-between group-hover:scale-105 transition-transform duration-500 flex-shrink-0`}>
                  <div className="flex justify-between items-start w-full">
                     <span className="bg-black/30 backdrop-blur-md border border-white/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Layers size={8} className="md:w-[10px] md:h-[10px] text-yellow-400"/> {course.category}
                     </span>
                     
                     {/* Status Badges on Card */}
                     <div className="flex gap-1">
                        {course.isLocked && <span className="bg-red-500/20 text-red-400 p-1 rounded-full"><div className="w-2 h-2 rounded-full bg-red-500"></div></span>}
                     </div>
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="p-3 md:p-6 flex flex-col flex-1 relative bg-[#111] justify-center md:justify-start">
                  <h3 className="text-sm md:text-xl font-bold text-white leading-tight mb-1 md:mb-3 mt-0 md:-mt-10 md:drop-shadow-lg line-clamp-2 md:line-clamp-1">
                    {course.title}
                  </h3>
                  
                  <p className="hidden md:block text-gray-400 text-xs line-clamp-2 mb-6 flex-1">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-0 md:pt-4 md:border-t border-white/5 md:mt-auto w-full">
                     <div className="flex flex-col">
                        <span className="hidden md:block text-[10px] text-gray-500 uppercase font-bold tracking-wider">Price</span>
                        <span className="text-sm md:text-lg font-black text-yellow-400">₹{course.price}</span>
                     </div>
                     {/* Buttons hata diye, text dikha diya */}
                     <span className="text-[10px] md:text-xs text-gray-600 group-hover:text-yellow-400 transition-colors flex items-center gap-1">
                        Manage <BookOpen size={12}/>
                     </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading & Empty States */}
        {isLoading && (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
        )}
        {!isLoading && filteredCourses.length === 0 && (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No courses found.</p>
                <button onClick={() => setIsFormOpen(true)} className="text-yellow-400 font-bold hover:underline mt-2">Create one now?</button>
            </div>
        )}

        {/* Create Modal only (Edit modal ab details page par hoga) */}
        <AnimatePresence>
          {isFormOpen && (
            <CourseForm 
              existingData={null} 
              onClose={() => setIsFormOpen(false)} 
              onRefresh={fetchCourses} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}