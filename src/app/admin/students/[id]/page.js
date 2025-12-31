"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  BookOpen, School, User, Hash, GraduationCap, Shield, AlertCircle, Edit2, Save, X, Power, Lock, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Make sure framer-motion is installed

export default function UserDetails() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Password Reset States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        setUser(data);
        setFormData(data); 
      } catch (err) {
        console.error("Error fetching user", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
      setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            setUser(updatedUser.user);
            setIsEditing(false);
            alert("Details updated successfully and email sent!");
        } else {
            alert("Failed to update details");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    } finally {
        setIsSaving(false);
    }
  };

  // Handle Admin Password Reset
  const handlePasswordReset = async (e) => {
      e.preventDefault();
      if(newPassword.length < 6) {
          alert("Password must be at least 6 characters");
          return;
      }

      setIsResettingPassword(true);
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPassword })
        });

        if (res.ok) {
            alert("Password changed successfully! User has been notified via email.");
            setShowPasswordModal(false);
            setNewPassword("");
        } else {
            alert("Failed to change password");
        }
      } catch (error) {
          alert("Error changing password");
      } finally {
          setIsResettingPassword(false);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-4">
        <div className="bg-red-500/10 p-4 rounded-full mb-4 text-red-500">
            <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">User Details Not Found</h2>
        <p className="text-gray-400 mb-6">Could not load data for ID: {id}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-3 pb-24 md:p-8 relative overflow-y-auto overflow-x-hidden selection:bg-yellow-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-900/10 rounded-full blur-[80px] md:blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-yellow-600/5 rounded-full blur-[60px] md:blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation & Actions */}
        <div className="sticky top-0 z-40 md:static flex flex-wrap justify-between items-center mb-6 md:mb-8 bg-[#050505]/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none py-3 md:py-0 -mx-3 px-3 md:mx-0 md:px-0 border-b border-white/5 md:border-none gap-3">
            <button 
              onClick={() => router.back()} 
              className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/5 transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="font-medium text-sm hidden md:inline">Back to Students</span>
            </button>

            <div className="flex gap-2 md:gap-3 ml-auto">
                {/* Password Reset Button */}
                <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs md:text-sm font-bold transition-all"
                >
                    <Lock size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Reset Password</span>
                </button>

                {isEditing ? (
                    <>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs md:text-sm font-bold transition-all"
                        >
                            <X size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Cancel</span>
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black text-xs md:text-sm font-bold transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                        >
                            {isSaving ? <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-black border-t-transparent"></div> : <Save size={14} className="md:w-4 md:h-4" />} 
                            Save
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 text-white text-xs md:text-sm font-bold transition-all"
                    >
                        <Edit2 size={14} className="md:w-4 md:h-4" /> Edit <span className="hidden md:inline">Details</span>
                    </button>
                )}
            </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-10 mb-4 md:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-30"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
            <div className={`w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-5xl font-bold shadow-2xl shrink-0 ${
                user.role === 'admin' 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/20' 
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-yellow-500/20'
              }`}>
              {formData.name?.charAt(0).toUpperCase()}
            </div>

            <div className="text-center md:text-left flex-1 w-full min-w-0">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-2 justify-center md:justify-start">
                {isEditing ? (
                    <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="text-2xl md:text-4xl font-black text-white bg-transparent border-b-2 border-yellow-500/50 focus:border-yellow-400 outline-none w-full md:w-auto text-center md:text-left truncate"
                        placeholder="Student Name"
                    />
                ) : (
                    <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight truncate max-w-full">{user.name}</h1>
                )}
                
                <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border shrink-0 ${
                    user.role === 'admin' 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                    : 'bg-green-500/10 text-green-300 border-green-500/20'
                }`}>
                    {user.role}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-6 text-gray-400 text-xs md:text-base font-medium mt-1 md:mt-2">
                <span className="flex items-center gap-1.5 md:gap-2">
                  <Mail size={14} className="md:w-4 md:h-4 text-yellow-500/70" /> {user.email}
                </span>
                <span className="flex items-center gap-1.5 md:gap-2">
                  <Calendar size={14} className="md:w-4 md:h-4 text-pink-500/70" /> 
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            {/* Personal Information */}
            <div className={`bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 transition-colors ${isEditing ? 'border-yellow-500/20 bg-yellow-500/[0.02]' : ''}`}>
              <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                <User size={18} className="md:w-5 md:h-5 text-blue-400" /> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <EditableInfoItem 
                    icon={<User size={16} className="md:w-[18px] md:h-[18px]" />} 
                    label="Father's Name" 
                    name="fatherName"
                    value={formData.fatherName} 
                    isEditing={isEditing}
                    onChange={handleChange}
                />
                <EditableInfoItem 
                    icon={<Phone size={16} className="md:w-[18px] md:h-[18px]" />} 
                    label="Phone Number" 
                    name="phone"
                    value={formData.phone} 
                    isEditing={isEditing}
                    onChange={handleChange}
                />
                <EditableInfoItem 
                    icon={<School size={16} className="md:w-[18px] md:h-[18px]" />} 
                    label="School Name" 
                    name="school"
                    value={formData.school} 
                    isEditing={isEditing}
                    onChange={handleChange}
                />
                <EditableInfoItem 
                    icon={<Hash size={16} className="md:w-[18px] md:h-[18px]" />} 
                    label="Class Level" 
                    name="classLevel"
                    value={formData.classLevel} 
                    isEditing={isEditing}
                    onChange={handleChange}
                />
              </div>
            </div>

            {/* Enrolled Courses Section - FIXED */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                 <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen size={18} className="md:w-5 md:h-5 text-yellow-400" /> Enrolled Courses
                 </h3>
                 <span className="bg-white/10 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold text-white">
                   {user.courses?.length || 0}
                 </span>
              </div>

              {user.courses && user.courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {user.courses.map((course, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-white/10 transition-colors group">
                       {/* Thumbnail Support if available */}
                       {course.thumbnail?.url && (
                           <div className="h-24 w-full bg-black/50 rounded-lg mb-3 overflow-hidden">
                                <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                           </div>
                       )}
                      <h4 className="font-bold text-white text-sm md:text-base mb-1 group-hover:text-yellow-400 transition-colors line-clamp-1">{course.title || "Untitled Course"}</h4>
                      <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400">
                        <span className="capitalize px-2 py-0.5 bg-white/5 rounded-full">{course.category || "General"}</span>
                        <span>{course.level || "Beginner"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500 bg-white/5 rounded-xl md:rounded-2xl border border-dashed border-white/10 text-sm">
                  <p>No courses enrolled yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Account Status */}
          <div className="md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
            <div className={`bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 transition-colors ${isEditing ? 'border-yellow-500/20' : ''}`}>
              <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 md:mb-4">Account Summary</h3>
              
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${formData.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <Power size={16} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-300">Account Status</span>
                   </div>
                   
                   {isEditing ? (
                        <button 
                            onClick={toggleStatus}
                            className={`px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                                formData.isActive 
                                ? 'bg-green-500 text-black hover:bg-green-400' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                        >
                            {formData.isActive ? 'Active' : 'Deactivated'}
                        </button>
                   ) : (
                       <span className={`font-bold text-xs md:text-sm ${formData.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                            {formData.isActive !== false ? 'Active' : 'Deactivated'}
                       </span>
                   )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <GraduationCap size={16} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-300">Student Type</span>
                   </div>
                   <span className="text-white font-bold text-xs md:text-sm">Regular</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-red-900/10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Key size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Reset Password</h3>
                <p className="text-gray-400 mt-2 text-sm">Force reset password for {user.name}. <br/>User will be notified via email.</p>
              </div>
              
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-gray-400 ml-1">New Password</label>
                  <input 
                    type="text" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500 outline-none" 
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium">Cancel</button>
                  <button type="submit" disabled={isResettingPassword || newPassword.length < 6} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50 hover:bg-red-700 transition-colors">
                    {isResettingPassword ? "Resetting..." : "Confirm Reset"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditableInfoItem({ icon, label, value, name, isEditing, onChange }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="mt-1 text-gray-500">{icon}</div>
      <div className="w-full min-w-0">
        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        
        {isEditing ? (
            <input 
                type="text"
                name={name}
                value={value || ""}
                onChange={onChange}
                className="w-full bg-transparent border-b border-white/20 focus:border-yellow-400 outline-none text-white text-sm md:text-base font-medium pb-1 transition-colors placeholder-gray-600"
                placeholder={`Enter ${label}`}
            />
        ) : (
            <p className="text-white text-sm md:text-base font-medium truncate">{value || "Not provided"}</p>
        )}
      </div>
    </div>
  );
}