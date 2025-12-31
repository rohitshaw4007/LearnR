"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/shared/Toast";
import { useAuth } from "@/components/shared/AuthContext";

// Icons (Same as before)
const MailIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>);
const LockIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const EyeIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>);

export default function Login() {
  const router = useRouter();
  const { addToast } = useToast();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    let tempErrors = {};
    if (!form.email) tempErrors.email = "Email is required";
    if (!form.password) tempErrors.password = "Password is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        addToast("Welcome back, Scholar!", "success");
        login(data.user);
        setTimeout(() => router.push("/"), 800);
      } else {
        addToast(data.error || "Login failed.", "error");
        setErrors({ api: data.error });
      }
    } catch (error) {
      setLoading(false);
      addToast("Connection error.", "error");
    }
  };

  return (
    // 'pt-24' added for Navbar clearance
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 pt-24 relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* --- PREMIUM BACKGROUND --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" />
         <motion.div animate={{ x: [0, -100, 0], y: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 18, repeat: Infinity, delay: 2 }} className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-yellow-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        // Compact sizing: max-w-[360px] for mobile feel, p-6 padding
        className="w-full max-w-[360px] bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-[0_0_100px_-20px_rgba(255,255,255,0.05)] relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-50"></div>

        <div className="text-center mb-6 mt-2">
          {/* Smaller heading */}
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-xs">Access your personalized learning dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Email</label>
            {/* Reduced height py-3 */}
            <div className={`group flex items-center bg-white/5 border rounded-xl px-4 py-3 transition-all focus-within:bg-white/10 focus-within:border-yellow-500/50 ${errors.email ? "border-red-500/50" : "border-white/5"}`}>
              <span className="text-gray-500 group-focus-within:text-yellow-400 transition-colors"><MailIcon /></span>
              <input type="email" placeholder="student@example.com" className="w-full bg-transparent text-white ml-3 outline-none placeholder-gray-600 text-sm font-medium" onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Password</label>
            {/* Reduced height py-3 */}
            <div className={`group flex items-center bg-white/5 border rounded-xl px-4 py-3 transition-all focus-within:bg-white/10 focus-within:border-yellow-500/50 ${errors.password ? "border-red-500/50" : "border-white/5"}`}>
              <span className="text-gray-500 group-focus-within:text-yellow-400 transition-colors"><LockIcon /></span>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-transparent text-white ml-3 outline-none placeholder-gray-600 text-sm font-medium" onChange={(e) => setForm({...form, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="#" className="text-[10px] text-gray-400 hover:text-white transition-colors font-medium">Forgot Password?</Link>
          </div>

          {/* Button Compact */}
          <motion.button 
            whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(234, 179, 8, 0.3)" }} 
            whileTap={{ scale: 0.99 }} 
            type="submit" 
            disabled={loading} 
            className="w-full bg-yellow-500 text-black font-bold py-3.5 rounded-xl shadow-lg transition-all relative overflow-hidden text-sm"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/> Processing...</span> : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs font-medium">Don't have an account? <Link href="/signup" className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors">Create Account</Link></p>
        </div>
      </motion.div>
    </div>
  );
}