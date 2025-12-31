"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Zap, 
  BookOpen, 
  Bell, 
  PlayCircle, 
  ChevronRight, 
  Radio 
} from "lucide-react";

export default function UserDashboard() {
  const [data, setData] = useState({
    userName: "Learner",
    totalCourses: 0,
    liveClassesCount: 0,
    liveCourseId: null,
    recentNotices: 0,
    courses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      
      {/* --- WELCOME HEADER --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <motion.p 
             initial={{ opacity: 0, x: -10 }} 
             animate={{ opacity: 1, x: 0 }} 
             className="text-gray-400 text-sm font-medium uppercase tracking-wider"
           >
             Welcome back
           </motion.p>
           <motion.h1 
             initial={{ opacity: 0, y: 10 }} 
             animate={{ opacity: 1, y: 0 }} 
             transition={{ delay: 0.1 }}
             className="text-3xl md:text-4xl font-black text-white mt-1"
           >
             {loading ? "..." : data.userName} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
           </motion.h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 p-[2px]">
           <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <span className="font-bold text-white text-lg">{data.userName[0]}</span>
           </div>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        
        {/* --- LIVE CLASS ALERT (Conditional) --- */}
        {data.liveClassesCount > 0 && (
           <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-red-600 p-[1px]">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x"></div>
              <div className="relative bg-[#0a0a0a] rounded-[23px] p-5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="relative">
                       <span className="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-75"></span>
                       <div className="relative w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                          <Radio size={20} />
                       </div>
                    </div>
                    <div>
                       <h3 className="font-bold text-white text-lg">Live Class Started</h3>
                       <p className="text-gray-400 text-xs">Tap to join your active session</p>
                    </div>
                 </div>
                 <Link href={`/dashboard/classroom/${data.liveCourseId}`} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-500 transition-colors">
                    JOIN NOW
                 </Link>
              </div>
           </motion.div>
        )}

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
           
           {/* Enrolled Courses */}
           <motion.div variants={item} className="bg-[#111] border border-white/5 p-4 rounded-2xl md:rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                 <BookOpen size={40} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase">My Courses</p>
              <h2 className="text-3xl font-black text-white mt-1">{data.totalCourses}</h2>
              <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                 <div className="h-full bg-yellow-500 w-3/4 rounded-full"></div>
              </div>
           </motion.div>

           {/* Learning Activity */}
           <motion.div variants={item} className="bg-[#111] border border-white/5 p-4 rounded-2xl md:rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Zap size={40} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase">Activity</p>
              <h2 className="text-3xl font-black text-white mt-1">85%</h2>
              <p className="text-green-400 text-[10px] flex items-center gap-1 mt-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Excellent
              </p>
           </motion.div>

           {/* Notices */}
           <motion.div variants={item} className="col-span-2 md:col-span-1 bg-[#111] border border-white/5 p-4 rounded-2xl md:rounded-3xl flex items-center justify-between group cursor-pointer hover:border-yellow-500/30 transition-all">
              <div>
                 <p className="text-gray-500 text-xs font-bold uppercase">New Notices</p>
                 <h2 className="text-3xl font-black text-white mt-1">{data.recentNotices}</h2>
                 <p className="text-gray-600 text-[10px] mt-1">Check updates</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                 <Bell size={24} />
              </div>
           </motion.div>

        </div>

        {/* --- MY COURSES CAROUSEL --- */}
        <div className="pt-4">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Continue Learning</h2>
              <Link href="/dashboard/classroom" className="text-xs text-yellow-500 font-bold hover:underline">View All</Link>
           </div>
           
           {loading ? (
             <div className="h-40 bg-[#111] rounded-3xl animate-pulse"></div>
           ) : data.courses.length === 0 ? (
             <div className="text-center p-8 bg-[#111] rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
                <Link href="/courses" className="mt-4 inline-block px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200">
                   Explore Courses
                </Link>
             </div>
           ) : (
             <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                {data.courses.map((course, i) => (
                   <motion.div 
                     key={course._id}
                     variants={item}
                     className="min-w-[85vw] md:min-w-[300px] snap-center bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-500/50 transition-all group relative"
                   >
                      <div className={`h-24 w-full bg-gradient-to-r ${course.gradient || 'from-gray-800 to-gray-900'}`}></div>
                      <div className="p-5 relative">
                         <div className="absolute -top-6 left-5 w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center shadow-lg">
                            <span className="text-2xl">🎓</span>
                         </div>
                         <div className="mt-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{course.category}</span>
                            <h3 className="text-lg font-bold text-white leading-tight mt-1 mb-2 line-clamp-1">{course.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                               <span>{course.students}+ Students</span>
                               <span>•</span>
                               <span>Best Seller</span>
                            </div>
                         </div>
                         
                         <Link 
                           href={`/dashboard/classroom/${course._id}`}
                           className="mt-4 w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group-hover:translate-x-1 duration-300"
                         >
                            <span className="text-xs font-bold text-white">Open Classroom</span>
                            <PlayCircle size={16} className="text-yellow-500" />
                         </Link>
                      </div>
                   </motion.div>
                ))}
             </div>
           )}
        </div>

      </motion.div>
    </div>
  );
}