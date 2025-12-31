"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ClassroomSidebar from "@/components/classroom/ClassroomNavbar"; // Name Navbar hai par kaam Sidebar ka karega
import ClassroomContent from "@/components/classroom/ClassroomContent";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ClassroomPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id) {
        setError("Invalid Course ID");
        setLoading(false);
        return;
    }
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/courses/${id}`);
        if (!res.ok) {
           if (res.status === 404) throw new Error("Course not found");
           throw new Error("Failed to load course data");
        }
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        console.error("Classroom Load Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-white">
         <Loader2 className="h-10 w-10 text-yellow-400 animate-spin mb-4" />
         <p className="text-gray-400 font-mono text-sm animate-pulse tracking-widest">INITIALIZING CLASSROOM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-white p-4 text-center">
         <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
         </div>
         <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
         <p className="text-gray-500 mb-6">{error}</p>
         <button 
            onClick={() => router.push("/admin/classroom")}
            className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
         >
            Back to Dashboard
         </button>
      </div>
    );
  }

  return (
    // Fixed container for the whole classroom app
    <div className="fixed inset-0 bg-[#050505] z-[100] overflow-hidden flex flex-col md:flex-row">
       
       {/* 1. LEFT SIDEBAR (Fixed) */}
       <ClassroomSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          courseTitle={course?.title} 
       />

       {/* 2. MAIN CONTENT AREA 
           - md:ml-64: Shifts content right on Desktop to make room for sidebar
           - pt-14 pb-20: Adds space for Mobile Header & Bottom Nav
       */}
       <div className="flex-1 relative h-full overflow-y-auto scroll-smooth md:ml-64 pt-14 pb-20 md:py-0 md:pb-0">
          <ClassroomContent activeTab={activeTab} courseData={course} />
       </div>

    </div>
  );
}