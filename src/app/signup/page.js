"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Compact Input Component
const InputField = ({ label, name, placeholder, value, onChange, error, type = "text", colSpan = "col-span-1", disabled = false, options = null }) => (
  <div className={`${colSpan} space-y-1`}>
    {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>}
    
    <div className={`relative bg-white/5 border rounded-xl transition-all focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-yellow-500/50 ${error ? "border-red-500/50" : "border-white/5 hover:border-white/10"}`}>
      {options ? (
        <div className="relative w-full">
          <select name={name} value={value} onChange={onChange} className="w-full h-full px-4 py-2.5 bg-transparent text-white outline-none text-sm font-medium appearance-none cursor-pointer [&>option]:bg-[#0a0a0a]">
              <option value="">{placeholder}</option>
              {options.map(opt => <option key={opt} value={opt}>Class {opt}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      ) : (
        <input name={name} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} disabled={disabled} className="w-full h-full px-4 py-2.5 bg-transparent text-white outline-none text-sm placeholder-gray-600 font-medium disabled:opacity-50 rounded-xl" />
      )}
    </div>
    {error && <p className="text-red-400 text-[9px] ml-1 font-medium">{error}</p>}
  </div>
);

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", fatherName: "", phone: "", email: "", otp: "", school: "", classLevel: "", password: "" });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    let temp = {};
    if (!form.name) temp.name = "Required";
    if (!form.fatherName) temp.fatherName = "Required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) temp.email = "Invalid";
    if (!form.phone || form.phone.length < 10) temp.phone = "Invalid";
    if (!form.password || form.password.length < 6) temp.password = "Min 6 chars";
    if (!form.school) temp.school = "Required";
    if (!form.classLevel) temp.classLevel = "Required";
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const sendOtp = async () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { setErrors({...errors, email: "Valid email required"}); return; }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email }) });
      const data = await res.json();
      if (data.success) { setOtpSent(true); alert("OTP Sent!"); } else { alert(data.error); }
    } catch(err) { alert("Error sending OTP"); }
    setOtpLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!otpSent) return alert("Verify email first!");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { router.push("/login"); } else { alert(data.error); }
    } catch(err) { alert("Signup failed"); }
    setLoading(false);
  };

  return (
    // Added pt-24 for Navbar clearance
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 pt-24 relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" />
         <motion.div animate={{ x: [0, -100, 0], y: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 18, repeat: Infinity, delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        // Compact sizing for App feel
        className="w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-[0_0_100px_-20px_rgba(255,255,255,0.05)] relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-50"></div>

        <div className="text-center mb-5 mt-1">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight mb-1">Create Account</h2>
          <p className="text-gray-500 text-xs">Join the platform and start learning.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          
          <InputField label="Full Name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} error={errors.name} colSpan="col-span-2 md:col-span-1" />
          <InputField label="Father's Name" name="fatherName" placeholder="Mr. Doe" value={form.fatherName} onChange={handleChange} error={errors.fatherName} colSpan="col-span-2 md:col-span-1" />
          <InputField label="Phone" name="phone" placeholder="Phone No." value={form.phone} onChange={handleChange} error={errors.phone} />
          
          <div className="col-span-1 space-y-1">
             <InputField label="Class" name="classLevel" placeholder="Class" value={form.classLevel} onChange={handleChange} error={errors.classLevel} options={[5,6,7,8,9,10,11,12]} />
          </div>

          <InputField label="School" name="school" placeholder="School Name" value={form.school} onChange={handleChange} error={errors.school} colSpan="col-span-2 md:col-span-1" />
          <InputField label="Password" name="password" type="password" placeholder="******" value={form.password} onChange={handleChange} error={errors.password} colSpan="col-span-2 md:col-span-1" />

          {/* Compact Email & OTP */}
          <div className="col-span-2 p-3 bg-white/5 rounded-xl border border-white/5 mt-1">
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                 <InputField label="Email" name="email" placeholder="mail@ex.com" value={form.email} onChange={handleChange} error={errors.email} disabled={otpSent} colSpan="col-span-1" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={sendOtp} disabled={otpSent || otpLoading} className="h-[42px] px-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-500 hover:text-black transition-all mb-[1px] disabled:opacity-50">
                {otpLoading ? "..." : otpSent ? "✓" : "Verify"}
              </motion.button>
            </div>
            <AnimatePresence>
              {otpSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden mt-2">
                   <InputField label="OTP" name="otp" placeholder="Enter 6-digit OTP" value={form.otp} onChange={handleChange} error={errors.otp} colSpan="col-span-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="col-span-2 mt-2 bg-yellow-500 text-black font-bold py-3 rounded-xl shadow-lg transition-all relative overflow-hidden text-sm">
            {loading ? "Creating..." : "Sign Up"}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-4">
          Already have an account? <Link href="/login" className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}