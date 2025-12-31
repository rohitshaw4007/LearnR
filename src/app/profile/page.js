"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/Toast"; 
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { user, login, loading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    email: "",
    phone: "",
    school: "",
    classLevel: "",
  });

  // Profile Update States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");

  // Password Change States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [isPasswordOtpSent, setIsPasswordOtpSent] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setFormData({
        name: user.name || "",
        fatherName: user.fatherName || "",
        email: user.email || "",
        phone: user.phone || "",
        school: user.school || "",
        classLevel: user.classLevel || "",
      });
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Profile Update Logic ---
  const initiateUpdate = async (e) => {
    e.preventDefault();
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/user/send-otp", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setShowOtpModal(true);
        addToast("OTP sent to your email!", "success");
      } else {
        addToast(data.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      addToast("Server connection failed", "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndUpdate = async (e) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    
    try {
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, otp: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowOtpModal(false); 
        setOtp(""); 
        if (data.user) login(data.user); 
        addToast("Profile updated successfully! ✅", "success");
      } else {
        addToast(data.message || "Invalid OTP", "error");
      }
    } catch (error) {
      console.error("Update failed:", error);
      addToast("Update failed. Please try again.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Password Change Logic ---
  const initiatePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters long", "error");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/send-password-otp", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setIsPasswordOtpSent(true);
        addToast("OTP sent for password change!", "success");
      } else {
        addToast(data.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      addToast("Failed to connect to server", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const verifyAndChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: passwordOtp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowPasswordModal(false);
        setNewPassword("");
        setPasswordOtp("");
        setIsPasswordOtpSent(false);
        addToast("Password changed successfully! 🔒", "success");
      } else {
        addToast(data.message || "Invalid OTP", "error");
      }
    } catch (error) {
      addToast("Something went wrong", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 pb-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Profile</span>
            </h1>
            <p className="text-gray-400 mt-2">Manage your personal information and academic details.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-yellow-400/20 to-purple-600/20" />
              <div className="relative mt-12 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-1 shadow-xl mb-4">
                  <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden">
                    {formData.name?.charAt(0).toUpperCase()}
                    <div className="absolute inset-0 bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{formData.name}</h2>
                <p className="text-sm text-yellow-400 font-medium bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">Student Account</p>
                <div className="w-full h-px bg-white/10 my-6" />
                <div className="w-full space-y-4">
                  <InfoItem icon={MailIcon} label="Email" value={formData.email} />
                  <InfoItem icon={PhoneIcon} label="Phone" value={formData.phone} />
                  <InfoItem icon={SchoolIcon} label="School" value={formData.school} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="col-span-1 lg:col-span-2">
            <form onSubmit={initiateUpdate} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-400 rounded-full"></span>Edit Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={UserIcon} />
                <InputGroup label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon={UserIcon} />
                <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} icon={PhoneIcon} />
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 text-gray-500"><MailIcon className="w-5 h-5" /></div>
                    <input type="text" value={formData.email} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed" />
                  </div>
                </div>
                <InputGroup label="School / College" name="school" value={formData.school} onChange={handleChange} icon={SchoolIcon} />
                <InputGroup label="Class / Standard" name="classLevel" value={formData.classLevel} onChange={handleChange} icon={BookIcon} />
              </div>
              <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/10 pt-6">
                {/* NEW: Change Password Button */}
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(true)} 
                  className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-colors"
                >
                  Change Password
                </button>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSendingOtp} className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSendingOtp ? "Sending OTP..." : "Save Changes"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Existing Profile Update OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOtpModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">Verify OTP</h3>
                <p className="text-gray-400 mt-2 text-sm">Enter the code sent to {formData.email}</p>
              </div>
              <form onSubmit={verifyAndUpdate} className="space-y-6">
                <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 text-center text-3xl font-bold text-white tracking-[0.5em] focus:border-yellow-400 outline-none" placeholder="000000" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowOtpModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium">Cancel</button>
                  <button type="submit" disabled={isVerifying || otp.length < 6} className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-bold disabled:opacity-50">
                    {isVerifying ? "Verifying..." : "Verify & Update"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW: Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-red-900/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">Change Password</h3>
                <p className="text-gray-400 mt-2 text-sm">Secure your account without old password.</p>
              </div>
              
              {!isPasswordOtpSent ? (
                // Step 1: Enter New Password
                <form onSubmit={initiatePasswordChange} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-400 ml-1">New Password</label>
                    <input 
                      type="text" // Shown as text initially or password? Usually password. 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500 outline-none" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium">Cancel</button>
                    <button type="submit" disabled={isChangingPassword || newPassword.length < 6} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50 hover:bg-red-700 transition-colors">
                      {isChangingPassword ? "Sending OTP..." : "Get OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                // Step 2: Verify OTP
                <form onSubmit={verifyAndChangePassword} className="space-y-6">
                   <div className="text-center mb-4">
                     <p className="text-green-400 text-sm">OTP sent to {formData.email}</p>
                   </div>
                   <input 
                    type="text" 
                    maxLength="6" 
                    value={passwordOtp} 
                    onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 text-center text-3xl font-bold text-white tracking-[0.5em] focus:border-red-500 outline-none" 
                    placeholder="000000" 
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setIsPasswordOtpSent(false); setPasswordOtp(""); }} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium">Back</button>
                    <button type="submit" disabled={isChangingPassword || passwordOtp.length < 6} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50 hover:bg-red-700 transition-colors">
                      {isChangingPassword ? "Verifying..." : "Change Password"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function InputGroup({ label, name, value, onChange, icon: Icon }) {
  return (
    <div className="space-y-2 group">
      <label className="text-sm font-medium text-gray-400 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-3.5 text-gray-500"><Icon className="w-5 h-5" /></div>
        <input type="text" name={name} value={value} onChange={onChange} required className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-yellow-400 outline-none" />
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
      <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center text-gray-400"><Icon className="w-5 h-5" /></div>
      <div className="text-left">
        <p className="text-xs text-gray-500 uppercase font-bold">{label}</p>
        <p className="text-sm text-gray-200">{value || "Not set"}</p>
      </div>
    </div>
  );
}

const UserIcon = (props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MailIcon = (props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const PhoneIcon = (props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const SchoolIcon = (props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const BookIcon = (props) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;