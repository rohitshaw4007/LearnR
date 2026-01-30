"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Edit, Trash2, Lock, Unlock, Eye, EyeOff, 
  Users, IndianRupee, Clock, Wallet, Search, UserX, AlertCircle, UserPlus, CreditCard, X, CheckCircle
} from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Manual Enroll States
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  
  // Smart Search States (New Logic)
  const [allUsers, setAllUsers] = useState([]); // Store all users for searching
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered list for dropdown
  const [showDropdown, setShowDropdown] = useState(false); // Toggle dropdown visibility
  const wrapperRef = useRef(null); // To detect click outside

  // Loading State for removing student
  const [removingId, setRemovingId] = useState(null);
  
  // Fetch Data
  const fetchData = async () => {
    try {
      const courseRes = await fetch(`/api/admin/courses/${id}`);
      const courseData = await courseRes.json();
      
      const studentsRes = await fetch(`/api/admin/courses/${id}/students`);
      const studentsData = await studentsRes.json();

      // Fetch ALL users for the smart search suggestion
      const usersRes = await fetch(`/api/admin/users`);
      const usersData = await usersRes.json();

      if (courseRes.ok) setCourse(courseData.course || courseData);
      if (studentsRes.ok) setStudentsList(studentsData);
      if (usersRes.ok) setAllUsers(usersData.users || usersData); // Populate all users

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(id) fetchData();
  }, [id]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleToggle = async (field, value) => {
    const originalValue = course[field];
    setCourse({ ...course, [field]: value });

    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (error) {
      setCourse({ ...course, [field]: originalValue });
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to delete this course? This will remove it for all students forever.")) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/courses");
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      alert("Error deleting course");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if(!confirm("Are you sure you want to remove this student? They will receive an email notification.")) return;
    setRemovingId(studentId); 

    try {
      const res = await fetch(`/api/admin/courses/${id}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      if (res.ok) {
        setStudentsList(prev => prev.filter(s => s._id !== studentId));
        setCourse(prev => ({ ...prev, students: prev.students - 1 }));
      } else {
        alert("Failed to remove student");
      }
    } catch (err) {
      alert("Error removing student");
    } finally {
      setRemovingId(null);
    }
  };

  // Logic for smart input change
  const handleEnrollInputChange = (e) => {
    const query = e.target.value;
    setEnrollEmail(query);

    if (query.length > 0) {
      const matches = allUsers.filter(user => 
        (user.name?.toLowerCase().includes(query.toLowerCase()) || 
         user.email?.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredUsers(matches);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Select user from dropdown
  const selectUser = (email) => {
    setEnrollEmail(email);
    setShowDropdown(false);
  };

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if(!enrollEmail) return;
    setEnrollLoading(true);
    
    try {
      const res = await fetch(`/api/admin/courses/${id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: enrollEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Success! ${data.student.name} enrolled.`);
        setEnrollEmail("");
        setIsEnrollModalOpen(false); 
        fetchData(); 
      } else {
        alert(data.error || "Enrollment failed");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Reusable Components
  const manualEnrollFormContent = (
    <form onSubmit={handleManualEnroll} className="space-y-3 md:space-y-4 relative z-10" ref={wrapperRef}>
        <div className="relative">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Student Search</label>
            <input 
                required
                type="text" 
                value={enrollEmail}
                onChange={handleEnrollInputChange}
                onFocus={() => enrollEmail && setShowDropdown(true)}
                placeholder="Type name or email..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:border-yellow-400 outline-none transition-all text-white"
                autoComplete="off"
            />
            
            {/* Smart Dropdown */}
            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
                {filteredUsers.map((user) => (
                  <div 
                    key={user._id}
                    onClick={() => selectUser(user.email)}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                  >
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
            
            {showDropdown && filteredUsers.length === 0 && enrollEmail && (
               <div className="absolute top-full left-0 w-full mt-1 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 text-xs text-gray-500 text-center">
                 No users found. You can still type the full email manually.
               </div>
            )}
        </div>
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                <CreditCard size={14} />
            </div>
            <div>
                <p className="text-xs font-bold text-green-400">Payment: Cash/Manual</p>
                <p className="text-[10px] text-green-400/60">System will mark as paid.</p>
            </div>
        </div>
        <button 
            disabled={enrollLoading}
            className="w-full py-2.5 md:py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm"
        >
            {enrollLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> : "Enroll Student Now"}
        </button>
    </form>
  );

  const sidebarCommonContent = (
    <>
      {/* Course ID Info */}
      <div className="p-4 md:p-5 rounded-3xl bg-[#111] border border-white/10 space-y-3 md:space-y-4">
          <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-yellow-400" /> System Info
          </h4>
          <div className="p-3 bg-black/50 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Course ID</p>
              <p className="text-xs text-gray-300 font-mono break-all mt-1">{course?._id}</p>
          </div>
          <div className="p-3 bg-black/50 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Last Updated</p>
              <p className="text-xs text-gray-300 mt-1">{course ? new Date(course.updatedAt).toLocaleDateString() : "-"}</p>
          </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-4 md:p-6">
          <div className="mb-3 md:mb-4">
              <h4 className="text-red-400 font-bold text-sm flex items-center gap-2">
                  <Trash2 size={16} /> Delete Course
              </h4>
              <p className="text-red-400/60 text-[10px] md:text-xs mt-1">
                  This action cannot be undone. All student data associated with this course will be unlinked.
              </p>
          </div>
          <button 
              onClick={handleDelete} 
              className="w-full py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all text-xs font-bold border border-red-500/20"
          >
              Delete Permanently
          </button>
      </div>
    </>
  );

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin text-yellow-400 rounded-full h-12 w-12 border-t-2 border-b-2"></div></div>;
  if (!course) return <div className="min-h-screen bg-black text-white p-10">Course not found</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative">
       {/* Background */}
       <div className={`absolute top-0 left-0 w-full h-[30vh] md:h-[40vh] bg-gradient-to-b ${course.gradient} opacity-20 blur-3xl pointer-events-none`}></div>

       <div className="max-w-7xl mx-auto p-3 md:p-8 relative z-10">
          
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 md:mb-6">
             <ArrowLeft size={20} /> <span className="text-sm md:text-base">Back to Courses</span>
          </button>

          {/* Header */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end justify-between mb-6 md:mb-10">
             <div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 inline-block">
                    {course.category}
                </span>
                <h1 className="text-2xl md:text-5xl font-black tracking-tight mb-2">{course.title}</h1>
                <p className="text-gray-400 max-w-2xl text-xs md:text-base leading-relaxed">{course.description}</p>
             </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs md:text-sm transition-all"
                >
                    <Edit size={16} /> Edit Details
                </button>
             </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2 hover:border-blue-500/30 transition-colors group">
                <Users className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                <div>
                    <p className="text-xl md:text-2xl font-bold">{course.students}</p>
                    <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Enrolled</p>
                </div>
              </div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2 hover:border-green-500/30 transition-colors group">
                <IndianRupee className="text-green-400 group-hover:scale-110 transition-transform" size={24} />
                <div>
                    <p className="text-xl md:text-2xl font-bold">{course.price}</p>
                    <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Price</p>
                </div>
              </div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2 hover:border-purple-500/30 transition-colors group">
                <Clock className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
                <div>
                    <p className="text-base md:text-lg font-bold">{course.duration}</p>
                    <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Duration</p>
                </div>
              </div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2 hover:border-yellow-500/30 transition-colors group">
                <Wallet className="text-yellow-400 group-hover:scale-110 transition-transform" size={24} />
                <div>
                    <p className="text-xl md:text-2xl font-bold">₹{(course.price * course.students).toLocaleString()}</p>
                    <p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Revenue</p>
                </div>
              </div>
          </div>

          {/* MAIN LAYOUT */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
             
             {/* LEFT COLUMN */}
             <div className="w-full md:w-2/3 space-y-6">
                
                {/* 1. CONTROLS */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-4 md:p-8">
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Course Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                                    {course.isActive ? <Eye size={18} className="text-green-400"/> : <EyeOff size={18} className="text-gray-400"/>}
                                    Visibility
                                </h4>
                                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{course.isActive ? "Visible on app." : "Hidden from users."}</p>
                            </div>
                            <button 
                                onClick={() => handleToggle('isActive', !course.isActive)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${course.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {course.isActive ? "ACTIVE" : "HIDDEN"}
                            </button>
                        </div>
                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                                    {course.isLocked ? <Lock size={18} className="text-red-400"/> : <Unlock size={18} className="text-blue-400"/>}
                                    Enrollment
                                </h4>
                                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{course.isLocked ? "Closed." : "Open."}</p>
                            </div>
                            <button 
                                onClick={() => handleToggle('isLocked', !course.isLocked)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${course.isLocked ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                            >
                                {course.isLocked ? "LOCKED" : "UNLOCKED"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. SIDEBAR CONTENT (MOBILE ONLY) */}
                <div className="md:hidden space-y-6">
                    <button 
                       onClick={() => setIsEnrollModalOpen(true)}
                       className="w-full py-3 bg-white/5 border border-white/10 hover:border-yellow-400/50 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                       <div className="p-1 bg-yellow-400 rounded-full text-black">
                         <UserPlus size={16} />
                       </div>
                       Manual Enroll Student
                    </button>
                    {sidebarCommonContent}
                </div>

                {/* 3. ENROLLED STUDENTS */}
                <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                           <Users size={18} className="text-yellow-400" /> Enrolled Students
                           <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400">{studentsList.length}</span>
                        </h3>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input 
                              type="text" 
                              placeholder="Search student..." 
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-400 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-gray-500 uppercase bg-white/5 sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-3 md:px-6 md:py-3 font-bold">Name</th>
                                        <th className="px-4 py-3 md:px-6 md:py-3 font-bold hidden md:table-cell">Details</th>
                                        <th className="px-4 py-3 md:px-6 md:py-3 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 md:px-6 md:py-4">
                                                <div className="font-bold text-white text-sm md:text-base">{student.name}</div>
                                                <div className="text-[10px] md:text-xs text-gray-500">{student.email}</div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 hidden md:table-cell">
                                                <div className="text-xs text-gray-400">
                                                    Joined: {new Date(student.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">{student.phone}</div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                                <button 
                                                    onClick={() => handleRemoveStudent(student._id)}
                                                    disabled={removingId === student._id}
                                                    className="px-3 py-1.5 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 text-[10px] md:text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 ml-auto"
                                                >
                                                    {removingId === student._id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <UserX size={14} />
                                                    )}
                                                    REMOVE
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                                <AlertCircle size={24} className="opacity-50" />
                                <p>No students found.</p>
                            </div>
                        )}
                    </div>
                </div>

             </div>

             {/* RIGHT COLUMN (DESKTOP) */}
             <div className="hidden md:flex w-full md:w-1/3 flex-col gap-6">
                
                {/* Manual Enroll Form (Desktop) */}
                <div className="bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-4 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 relative z-10">
                        <UserPlus size={18} className="text-yellow-400" /> Manual Enroll
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-400 mb-4 md:mb-6 relative z-10">
                        Manually enroll a student (Cash Payment).
                    </p>
                    {manualEnrollFormContent}
                </div>

                {sidebarCommonContent}
             </div>

          </div>

          <AnimatePresence>
            {isEditOpen && (
                <CourseForm 
                existingData={course} 
                onClose={() => setIsEditOpen(false)} 
                onRefresh={() => { fetchData(); setIsEditOpen(false); }} 
                />
            )}
            
            {/* Mobile Manual Enroll Modal */}
            {isEnrollModalOpen && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6"
               >
                 <motion.div 
                   initial={{ y: "100%" }} 
                   animate={{ y: 0 }}
                   exit={{ y: "100%" }}
                   // FIXED: Added pb-24 to create gap from bottom for Navbar
                   className="bg-[#111] w-full max-w-sm rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 pb-24 relative"
                 >
                    <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden"></div>
                    <button 
                      onClick={() => setIsEnrollModalOpen(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                       <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <UserPlus size={18} className="text-yellow-400" /> Manual Enroll
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">Enter email to enroll immediately.</p>
                    
                    {manualEnrollFormContent}
                 </motion.div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
}