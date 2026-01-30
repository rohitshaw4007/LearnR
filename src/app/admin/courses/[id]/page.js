"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Edit, Trash2, Lock, Unlock, Eye, EyeOff, 
  Users, IndianRupee, Clock, Wallet, Search, UserX, AlertCircle, UserPlus, CreditCard, X
} from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";

const getMonthsDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months >= 0 ? months + 1 : 1; 
};

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const [enrollEmail, setEnrollEmail] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]); 
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  
  const [allUsers, setAllUsers] = useState([]); 
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [showDropdown, setShowDropdown] = useState(false); 
  const wrapperRef = useRef(null); 
  const [removingId, setRemovingId] = useState(null);
  
  const fetchData = async () => {
    try {
      const courseRes = await fetch(`/api/admin/courses/${id}`);
      const courseData = await courseRes.json();
      
      const studentsRes = await fetch(`/api/admin/courses/${id}/students`);
      const studentsData = await studentsRes.json();

      const usersRes = await fetch(`/api/admin/users`);
      const usersData = await usersRes.json();

      if (courseRes.ok) setCourse(courseData.course || courseData);
      if (studentsRes.ok) setStudentsList(studentsData);
      if (usersRes.ok) setAllUsers(usersData.users || usersData); 

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if(id) fetchData(); }, [id]);

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
      await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (error) {
      setCourse({ ...course, [field]: originalValue });
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("CRITICAL WARNING: Delete this course?")) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/courses");
      else alert("Delete failed");
    } catch (error) { alert("Error deleting course"); }
  };

  const handleRemoveStudent = async (studentId) => {
    if(!confirm("Remove this student?")) return;
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
      } else alert("Failed to remove student");
    } catch (err) { alert("Error removing student"); } 
    finally { setRemovingId(null); }
  };

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
    } else setShowDropdown(false);
  };

  const selectUser = (email) => {
    setEnrollEmail(email);
    setShowDropdown(false);
  };

  const monthsPassed = joinDate ? getMonthsDifference(joinDate, new Date()) : 1;
  const calculatedFee = course ? (monthsPassed * Number(course.price)) : 0;

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if(!enrollEmail) return;
    setEnrollLoading(true);
    
    try {
      const res = await fetch(`/api/admin/courses/${id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            email: enrollEmail,
            joinDate: joinDate,
            initialPaidAmount: calculatedFee 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Success! Enrolled from: ${joinDate}.\nTotal Fee Recorded: ₹${calculatedFee}`);
        setEnrollEmail("");
        setJoinDate(new Date().toISOString().split('T')[0]); 
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

  const manualEnrollFormContent = (
    <form onSubmit={handleManualEnroll} className="space-y-3 md:space-y-4 relative z-10" ref={wrapperRef}>
        <div className="relative">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Student Search</label>
            <input required type="text" value={enrollEmail} onChange={handleEnrollInputChange} onFocus={() => enrollEmail && setShowDropdown(true)} placeholder="Type name or email..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:border-yellow-400 outline-none transition-all text-white" autoComplete="off" />
            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
                {filteredUsers.map((user) => (
                  <div key={user._id} onClick={() => selectUser(user.email)} className="px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
        <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Joining Date (Offline Start)</label>
            <input type="date" required value={joinDate} onChange={(e) => setJoinDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:border-yellow-400 outline-none transition-all text-white [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-yellow-400">Total Due (Since Joining)</p>
                <span className="text-xs font-mono text-white bg-black/30 px-2 py-1 rounded">{monthsPassed} Month{monthsPassed > 1 ? 's' : ''}</span>
            </div>
            <p className="text-lg font-black text-white">₹ {calculatedFee.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-1">System will record <b>₹{calculatedFee}</b> as initial payment.</p>
        </div>
        <button disabled={enrollLoading} className="w-full py-2.5 md:py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm">
            {enrollLoading ? "Processing..." : "Enroll Student Now"}
        </button>
    </form>
  );

  const sidebarCommonContent = (
    <>
      <div className="p-4 md:p-5 rounded-3xl bg-[#111] border border-white/10 space-y-3 md:space-y-4">
          <h4 className="font-bold text-white flex items-center gap-2 text-sm"><AlertCircle size={16} className="text-yellow-400" /> System Info</h4>
          <div className="p-3 bg-black/50 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase font-bold">Course ID</p><p className="text-xs text-gray-300 font-mono break-all mt-1">{course?._id}</p></div>
          <div className="p-3 bg-black/50 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase font-bold">Last Updated</p><p className="text-xs text-gray-300 mt-1">{course ? new Date(course.updatedAt).toLocaleDateString() : "-"}</p></div>
      </div>
      <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-4 md:p-6">
          <div className="mb-3 md:mb-4"><h4 className="text-red-400 font-bold text-sm flex items-center gap-2"><Trash2 size={16} /> Delete Course</h4><p className="text-red-400/60 text-[10px] md:text-xs mt-1">This action cannot be undone.</p></div>
          <button onClick={handleDelete} className="w-full py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all text-xs font-bold border border-red-500/20">Delete Permanently</button>
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
       <div className={`absolute top-0 left-0 w-full h-[30vh] md:h-[40vh] bg-gradient-to-b ${course.gradient} opacity-20 blur-3xl pointer-events-none`}></div>
       <div className="max-w-7xl mx-auto p-3 md:p-8 relative z-10">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 md:mb-6">
             <ArrowLeft size={20} /> <span className="text-sm md:text-base">Back to Courses</span>
          </button>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end justify-between mb-6 md:mb-10">
             <div><span className="px-3 py-1 rounded-full bg-white/10 text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 inline-block">{course.category}</span><h1 className="text-2xl md:text-5xl font-black tracking-tight mb-2">{course.title}</h1><p className="text-gray-400 max-w-2xl text-xs md:text-base leading-relaxed">{course.description}</p></div>
             <div className="flex items-center gap-3"><button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs md:text-sm transition-all"><Edit size={16} /> Edit Details</button></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2"><Users className="text-blue-400" size={24} /><div><p className="text-xl md:text-2xl font-bold">{course.students}</p><p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold">Enrolled</p></div></div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2"><IndianRupee className="text-green-400" size={24} /><div><p className="text-xl md:text-2xl font-bold">{course.price}</p><p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold">Price</p></div></div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2"><Clock className="text-purple-400" size={24} /><div><p className="text-base md:text-lg font-bold">{course.duration}</p><p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold">Duration</p></div></div>
              <div className="bg-[#111] border border-white/10 p-3 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 md:gap-2"><Wallet className="text-yellow-400" size={24} /><div><p className="text-xl md:text-2xl font-bold">₹{(course.price * course.students).toLocaleString()}</p><p className="text-[9px] md:text-xs text-gray-500 uppercase font-bold">Revenue</p></div></div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
             <div className="w-full md:w-2/3 space-y-6">
                <div className="bg-[#111] border border-white/10 rounded-3xl p-4 md:p-8">
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Course Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div><h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">{course.isActive ? <Eye size={18} className="text-green-400"/> : <EyeOff size={18} className="text-gray-400"/>} Visibility</h4><p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{course.isActive ? "Visible on app." : "Hidden from users."}</p></div>
                            <button onClick={() => handleToggle('isActive', !course.isActive)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold ${course.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>{course.isActive ? "ACTIVE" : "HIDDEN"}</button>
                        </div>
                        <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div><h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">{course.isLocked ? <Lock size={18} className="text-red-400"/> : <Unlock size={18} className="text-blue-400"/>} Enrollment</h4><p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{course.isLocked ? "Closed." : "Open."}</p></div>
                            <button onClick={() => handleToggle('isLocked', !course.isLocked)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold ${course.isLocked ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{course.isLocked ? "LOCKED" : "UNLOCKED"}</button>
                        </div>
                    </div>
                </div>

                <div className="md:hidden space-y-6">
                    <button onClick={() => setIsEnrollModalOpen(true)} className="w-full py-3 bg-white/5 border border-white/10 hover:border-yellow-400/50 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"><div className="p-1 bg-yellow-400 rounded-full text-black"><UserPlus size={16} /></div> Manual Enroll Student</button>
                    {sidebarCommonContent} 
                </div>

                <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2"><Users size={18} className="text-yellow-400" /> Enrolled Students <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400">{studentsList.length}</span></h3>
                        <div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} /><input type="text" placeholder="Search student..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-400 outline-none transition-all"/></div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-gray-500 uppercase bg-white/5 sticky top-0 backdrop-blur-md">
                                    <tr><th className="px-4 py-3 md:px-6 md:py-3 font-bold">Name</th><th className="px-4 py-3 md:px-6 md:py-3 font-bold hidden md:table-cell">Joined</th><th className="px-4 py-3 md:px-6 md:py-3 font-bold text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 md:px-6 md:py-4"><div className="font-bold text-white text-sm md:text-base">{student.name}</div><div className="text-[10px] md:text-xs text-gray-500">{student.email}</div></td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 hidden md:table-cell"><div className="text-xs text-gray-400">{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : new Date(student.createdAt).toLocaleDateString()}</div><div className="text-xs text-gray-500">{student.phone}</div></td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 text-right"><button onClick={() => handleRemoveStudent(student._id)} disabled={removingId === student._id} className="px-3 py-1.5 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 text-[10px] md:text-xs font-bold rounded-lg transition-all ml-auto flex items-center gap-1">{removingId === student._id ? "..." : <UserX size={14} />} REMOVE</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (<div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2"><AlertCircle size={24} className="opacity-50" /><p>No students found.</p></div>)}
                    </div>
                </div>
             </div>

             <div className="hidden md:flex w-full md:w-1/3 flex-col gap-6">
                <div className="bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-4 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 relative z-10"><UserPlus size={18} className="text-yellow-400" /> Manual Enroll</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 mb-4 md:mb-6 relative z-10">Manually enroll a student (Cash Payment).</p>
                    {manualEnrollFormContent}
                </div>
                {sidebarCommonContent}
             </div>
          </div>
          <AnimatePresence>
            {isEditOpen && (<CourseForm existingData={course} onClose={() => setIsEditOpen(false)} onRefresh={() => { fetchData(); setIsEditOpen(false); }} />)}
            {isEnrollModalOpen && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6">
                 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#111] w-full max-w-sm rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 pb-24 relative">
                    <button onClick={() => setIsEnrollModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><UserPlus size={18} className="text-yellow-400" /> Manual Enroll</h3>
                    {manualEnrollFormContent}
                 </motion.div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
}