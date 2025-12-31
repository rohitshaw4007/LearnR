"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MonitorPlay, ChevronRight, RefreshCcw, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentClassroomList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      // NOTE: Ensure this API endpoint returns courses the user is enrolled in
      const res = await fetch("/api/user/enrollments"); 
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
      else if (data.enrollments) setCourses(data.enrollments); 
      else setCourses([]);
    } catch (err) {
      console.error("Failed to load enrollments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Glow - Yellow ab */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
                  My <span className="text-yellow-400">Classroom</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base">Jump back into your learning journey.</p>
            </div>
            <button onClick={fetchEnrolledCourses} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
           {!loading && courses.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-50">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-600"/>
                  <p>You haven't enrolled in any courses yet.</p>
                  <button onClick={() => router.push('/courses')} className="mt-4 text-yellow-400 font-bold hover:underline">Browse Courses</button>
              </div>
           )}

           <AnimatePresence>
             {courses.map((item, index) => {
               const course = item.course || item; 
               return (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => router.push(`/dashboard/classroom/${course._id}`)}
                  className="group cursor-pointer bg-[#0a0a0a] border border-white/10 hover:border-yellow-400/50 rounded-2xl md:rounded-3xl overflow-hidden relative flex flex-row md:flex-col h-24 md:h-auto items-center md:items-stretch shadow-lg"
                >
                  {/* Icon Area */}
                  <div className={`w-24 md:w-full h-full md:h-32 bg-gradient-to-br ${course.gradient || 'from-gray-900 to-black'} p-0 md:p-6 relative flex items-center justify-center md:block shrink-0`}>
                      <div className="md:hidden text-white/80"><MonitorPlay size={24} /></div>
                      <div className="hidden md:block absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
                      <span className="hidden md:inline-block relative z-10 bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-white uppercase">
                          {course.category || "Course"}
                      </span>
                  </div>

                  {/* Content */}
                  <div className="p-3 md:p-6 flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                              <span className="md:hidden text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 block">{course.category}</span>
                              <h3 className="text-sm md:text-xl font-bold text-white leading-tight truncate group-hover:text-yellow-400 transition-colors">{course.title}</h3>
                          </div>
                          <ChevronRight size={18} className="text-gray-600 md:hidden ml-2" />
                      </div>
                      
                      <div className="hidden md:flex mt-6 pt-4 border-t border-white/5 justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">Continue Learning</span>
                          <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">ENTER CLASS <MonitorPlay size={12}/></span>
                      </div>
                  </div>
                </motion.div>
               );
             })}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}