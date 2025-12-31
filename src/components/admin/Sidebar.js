"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Users, LogOut, Home, MonitorPlay } from "lucide-react";
import { useAuth } from "@/components/shared/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  
  // FIX: Destructuring ko safe banaya gaya hai
  const auth = useAuth();
  const logout = auth?.logout || (() => console.log("Logout function not ready"));

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/admin" },
    { name: "Courses", icon: BookOpen, path: "/admin/courses" },
    { name: "Students", icon: Users, path: "/admin/students" },
    { name: "Classroom", icon: MonitorPlay, path: "/admin/classroom" },
  ];

  return (
    <>
      {/* =======================
          1. DESKTOP SIDEBAR 
         ======================= */}
      <div className="hidden md:flex h-screen w-64 bg-[#0a0a0a] border-r border-white/10 flex-col fixed left-0 top-0 z-50">
        <div className="p-8">
          <Link href="/" className="group block">
              <h1 className="text-2xl font-black text-white tracking-tighter transition-opacity group-hover:opacity-80">
              Learn<span className="text-yellow-400">R</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-2 text-gray-400 font-medium tracking-wide">ADMIN</span>
              </h1>
          </Link>
        </div>

        <div className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = item.path === "/admin" 
              ? pathname === "/admin" 
              : pathname.startsWith(item.path);

            return (
              <Link key={item.name} href={item.path} className="block relative group">
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-xl border-l-4 border-yellow-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive ? "text-yellow-400 font-bold" : "text-gray-400 group-hover:text-white group-hover:bg-white/5"}`}>
                  <item.icon size={20} className={isActive ? "text-yellow-400" : "text-gray-500 group-hover:text-white"} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group">
            <LogOut size={20} />
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </div>

      {/* =======================
          2. MOBILE BOTTOM NAV 
         ======================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {menuItems.map((item) => {
             const isActive = item.path === "/admin" 
               ? pathname === "/admin" 
               : pathname.startsWith(item.path);

            return (
              <Link key={item.name} href={item.path} className="relative flex flex-col items-center justify-center w-full h-full space-y-1">
                 {isActive && (
                    <motion.div 
                      layoutId="activeTabMobile"
                      className="absolute -top-[1px] w-12 h-1 bg-yellow-400 rounded-b-lg shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    />
                 )}
                 <item.icon size={22} className={`transition-colors duration-300 ${isActive ? "text-yellow-400" : "text-gray-500"}`} />
                 <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? "text-yellow-400" : "text-gray-600"}`}>
                   {item.name}
                 </span>
              </Link>
            );
          })}
          
          <Link href="/" className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 active:text-white">
             <Home size={22} />
             <span className="text-[10px] font-medium">Home</span>
          </Link>
        </div>
      </div>
    </>
  );
}