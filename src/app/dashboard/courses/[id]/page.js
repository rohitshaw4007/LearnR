"use client";
import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, CheckCircle, Lock, FileText, MessageSquare } from "lucide-react";

export default function CourseLearningPage({ params }) {
  // Params unwrap karne ka naya tareeka Next.js 15+ mein (agar purana version hai to seedha params.id use karein)
  const resolvedParams = use(params); 
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Is specific course ko fetch karte hain
    // Note: Hum public API use kar rahe hain kyunki course details public hain,
    // lekin future mein isse protected route bana sakte hain.
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`);
        const data = await res.json();
        setCourse(data.course);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchCourse();
  }, [courseId]);

  if (loading) return <div className="text-white text-center mt-20">Loading Classroom...</div>;
  if (!course) return <div className="text-white text-center mt-20">Course not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Top Bar - Back Button & Title */}
      <div className="flex items-center gap-4 mb-6">
         <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
         </Link>
         <div>
            <h1 className="text-xl font-bold text-white line-clamp-1">{course.title}</h1>
            <p className="text-xs text-gray-400">Level: {course.level}</p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* LEFT: Main Content (Video Player Area) */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
           
           {/* Video Player Placeholder */}
           <div className="aspect-video w-full bg-black border border-white/10 rounded-2xl relative overflow-hidden group shadow-2xl">
              {/* Thumbnail / Gradient */}
              <div className={`absolute inset-0 ${course.gradient || 'bg-gray-800'} opacity-50`}></div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <button className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(250,204,21,0.4)] group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={32} fill="currentColor" className="ml-1" />
                 </button>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                 <p className="text-white font-bold text-lg drop-shadow-md">Introduction to {course.title}</p>
              </div>
           </div>

           {/* Tabs Navigation */}
           <div className="flex border-b border-white/10">
              {['overview', 'resources', 'discussion'].map((tab) => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-all border-b-2 ${
                       activeTab === tab 
                       ? "border-yellow-400 text-yellow-400" 
                       : "border-transparent text-gray-400 hover:text-white"
                    }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="bg-[#111] p-6 rounded-2xl border border-white/5 min-h-[200px]">
              {activeTab === 'overview' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-lg font-bold text-white mb-2">About this Course</h3>
                    <p className="text-gray-400 leading-relaxed">{course.description}</p>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-white/5 p-3 rounded-xl">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-bold text-white">{course.duration}</p>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl">
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="font-bold text-white">{course.category}</p>
                       </div>
                    </div>
                 </motion.div>
              )}
              {activeTab === 'resources' && (
                 <div className="text-gray-400 text-center py-10">
                    <FileText className="mx-auto mb-2 opacity-50" />
                    No extra resources attached yet.
                 </div>
              )}
               {activeTab === 'discussion' && (
                 <div className="text-gray-400 text-center py-10">
                    <MessageSquare className="mx-auto mb-2 opacity-50" />
                    Discussion forum coming soon.
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT: Sidebar (Course Content / Syllabus) */}
        <div className="w-full lg:w-96 bg-[#0f0f0f] border border-white/10 rounded-2xl flex flex-col h-[500px] lg:h-auto overflow-hidden">
           <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-white">Course Content</h3>
              <p className="text-xs text-gray-400 mt-1">1 Section • 1 Lecture</p>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {/* Section Header */}
              <div className="mb-2">
                 <p className="text-xs font-bold text-gray-500 uppercase px-2 py-2">Section 1: Getting Started</p>
                 
                 {/* Lesson Item (Active) */}
                 <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-yellow-500/30 cursor-pointer hover:bg-white/15 transition-all">
                    <div className="mt-1">
                       <PlayCircle size={16} className="text-yellow-400" />
                    </div>
                    <div>
                       <p className="text-sm font-medium text-white">1. Introduction</p>
                       <p className="text-[10px] text-gray-400 mt-0.5">10:00 mins</p>
                    </div>
                 </div>

                 {/* Placeholder Future Lessons (Locked) */}
                 {[2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all opacity-60">
                       <div className="mt-1">
                          <Lock size={16} className="text-gray-600" />
                       </div>
                       <div>
                          <p className="text-sm font-medium text-gray-300">Lesson {i}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Coming Soon</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}