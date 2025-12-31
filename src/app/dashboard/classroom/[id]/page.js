"use client";
import { useState, useEffect, use, Suspense } from "react"; 
import { useRouter, useSearchParams } from "next/navigation"; 
import StudentClassroomSidebar from "@/components/classroom/StudentClassroomSidebar";
import StudentClassroomContent from "@/components/classroom/StudentClassroomContent";
import { Loader2, AlertTriangle, Lock } from "lucide-react"; // Added Lock icon

// 1. Inner Component (Where Logic Lives)
function ClassroomInner({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  // 2. State Initialization
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // New: Store Enrollment Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Sync State when URL Changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
        setActiveTab(tab);
    }
  }, [searchParams]);

  // 4. Custom Tab Handler
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.replace(`/dashboard/classroom/${id}?tab=${newTab}`, { scroll: false });
  };

  useEffect(() => {
    if (!id) return;

    const initData = async () => {
      try {
        setLoading(true);
        
        // Fetch Course Data
        const courseRes = await fetch(`/api/admin/courses/${id}`); 
        if (!courseRes.ok) throw new Error("Course not found");
        const courseData = await courseRes.json();
        setCourse(courseData);

        // Fetch User Data
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
            const userData = await userRes.json();
            setStudent(userData.user);

            // Fetch Enrollment Status (To check for Blocked/Fee Due)
            const enrollRes = await fetch(`/api/user/enrollments`);
            if (enrollRes.ok) {
                const enrollData = await enrollRes.json();
                // Find enrollment for THIS course
                const myEnrollment = enrollData.enrollments?.find(e => 
                    (e.course._id === id) || (e.course === id)
                );
                if (myEnrollment) {
                    setEnrollmentStatus(myEnrollment);
                }
            }
        }

      } catch (err) {
        console.error("Classroom Load Error:", err);
        setError("Unable to load classroom. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-white">
         <Loader2 className="h-10 w-10 text-yellow-400 animate-spin mb-4" />
         <p className="text-gray-500 font-mono text-xs animate-pulse">ENTERING CLASSROOM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-white p-4 text-center">
         <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
         <p className="text-gray-400 mb-6">{error}</p>
         <button onClick={() => router.push("/dashboard/classroom")} className="px-6 py-2 bg-white text-black font-bold rounded-full">Back</button>
      </div>
    );
  }

  // --- LOGIC: BLOCK ACCESS IF FEE IS OVERDUE (isBlocked = true) ---
  if (enrollmentStatus && enrollmentStatus.isBlocked) {
      return (
        <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="bg-red-900/10 p-8 rounded-2xl border border-red-500/30 max-w-md w-full backdrop-blur-sm">
                <Lock className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2 text-red-100">Access Restricted</h2>
                <p className="text-gray-400 mb-6 text-sm">
                    Your subscription for <span className="text-white font-medium">{course?.title}</span> has expired. 
                    You have exceeded the grace period.
                </p>
                <div className="bg-black/40 p-4 rounded-lg mb-6 border border-white/5">
                    <p className="text-sm text-yellow-500">Pending Monthly Fee</p>
                    <p className="text-xs text-gray-500 mt-1">Please pay to unlock immediately.</p>
                </div>
                
                <button 
                    onClick={() => router.push(`/courses/${id}`)} 
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-900/20"
                >
                    Pay Now & Unlock
                </button>
                <button 
                    onClick={() => router.push("/dashboard/classroom")}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-300"
                >
                    Go Back to Dashboard
                </button>
            </div>
        </div>
      );
  }

  // --- LOGIC: CHECK IF FEE IS DUE (BUT NOT BLOCKED YET) ---
  const isFeeDue = enrollmentStatus?.nextPaymentDue && new Date() > new Date(enrollmentStatus.nextPaymentDue);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] overflow-hidden flex flex-col md:flex-row">
       <StudentClassroomSidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          courseTitle={course?.title} 
       />

       <div className="flex-1 relative h-full overflow-y-auto scroll-smooth md:ml-64 pt-14 pb-20 md:py-0 md:pb-0">
          
          {/* WARNING BANNER (Shows only if Fee is Due but user is NOT blocked yet) */}
          {isFeeDue && (
              <div className="bg-yellow-900/20 border-b border-yellow-600/30 p-2 text-center backdrop-blur-md sticky top-0 z-50">
                  <p className="text-yellow-500 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      Monthly Fee is Due! Please pay to avoid account suspension.
                      <button 
                        onClick={() => router.push(`/courses/${id}`)} 
                        className="underline ml-2 text-white hover:text-yellow-400"
                      >
                        Pay Now
                      </button>
                  </p>
              </div>
          )}

          <StudentClassroomContent 
            activeTab={activeTab} 
            courseData={course} 
            studentName={student?.name} 
          />
       </div>
    </div>
  );
}

// 5. Main Wrapper with Suspense
export default function StudentClassroomPage({ params }) {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <ClassroomInner params={params} />
        </Suspense>
    );
}