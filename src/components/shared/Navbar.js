"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/shared/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Admin, Dashboard aur Portal (Exam) routes par Navbar hide karein
  if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/portal"))) {
    return null;
  }

  // Helper function to get correct href
  const getHref = (item) => {
    if (item === 'Home') return '/';
    if (item === 'About') return '/#about';
    if (item === 'Contact') return '/#contact';
    return `/${item.toLowerCase()}`;
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-b ${
          isScrolled
            ? "bg-black/80 backdrop-blur-2xl border-white/10 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.37)]"
            : "bg-transparent border-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo - Clickable & Closes Mobile Menu */}
            <div className="flex-shrink-0 relative z-50">
              <Link 
                href="/" 
                className="flex items-center gap-1 group cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <span className={`font-black text-white tracking-tighter transition-all duration-300 ${isScrolled ? "text-2xl" : "text-3xl"}`}>
                  Learn<span className="text-yellow-400 inline-block group-hover:-rotate-12 transition-transform duration-300">R</span>
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'Courses', 'About', 'Contact'].map((item) => (
                <Link 
                  key={item} 
                  href={getHref(item)} 
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group py-2"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-yellow-400 transition-all duration-300 group-hover:w-full opacity-80 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/login" className="text-white hover:text-yellow-400 font-medium transition-colors text-sm px-2">
                    Login
                  </Link>
                  <Link href="/signup">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-yellow-400 text-black font-bold py-2.5 px-6 rounded-full hover:bg-yellow-300 hover:shadow-[0_0_20px_-5px_rgba(250,204,21,0.5)] transition-all text-sm cursor-pointer"
                    >
                      Get Started
                    </motion.div>
                  </Link>
                </>
              ) : (
                // Desktop Profile - HOVER Based
                <div 
                  className="relative py-2"
                  onMouseEnter={() => setIsProfileOpen(true)}
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <button 
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1 pr-4 py-1 transition-all duration-300 group focus:outline-none ring-1 ring-transparent hover:ring-white/10"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-sm shadow-inner relative overflow-hidden">
                       {user.name?.charAt(0).toUpperCase()}
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    {/* Name & Email Info */}
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors leading-tight">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 max-w-[100px] truncate leading-tight">
                        {user.email}
                      </span>
                    </div>

                    {/* Dropdown Arrow */}
                    <svg className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-yellow-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, rotateX: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl z-50 origin-top-right ring-1 ring-white/5"
                      >
                        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent">
                          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">Signed In As</p>
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>

                        <div className="p-2 space-y-1">
                          {user.role === 'admin' ? (
                            <Link href="/admin/courses" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all group">
                              <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-purple-500/20 text-gray-400 group-hover:text-purple-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              </span>
                              Admin Panel
                            </Link>
                          ) : (
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all group">
                              <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/20 text-gray-400 group-hover:text-blue-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              </span>
                              Dashboard
                            </Link>
                          )}

                          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all group">
                            <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-yellow-500/20 text-gray-400 group-hover:text-yellow-400 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </span>
                            Profile
                          </Link>

                          <div className="h-px bg-white/5 my-1"></div>

                          <button 
                            onClick={() => { logout(); setIsProfileOpen(false); }} 
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group"
                          >
                            <span className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </span>
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden relative z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative w-10 h-10 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex flex-col justify-between w-[18px] h-[14px] transform transition-all duration-300 origin-center overflow-hidden">
                  <div className={`bg-white h-[2px] w-7 transform transition-all duration-300 origin-left ${isOpen ? "rotate-[42deg] w-2/3" : ""}`}></div>
                  <div className={`bg-white h-[2px] w-7 rounded transform transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}></div>
                  <div className={`bg-white h-[2px] w-7 transform transition-all duration-300 origin-left ${isOpen ? "-rotate-[42deg] w-2/3" : ""}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Mobile Menu Overlay - Clickable Background */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsOpen(false)} // Close when clicking outside
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-6 flex flex-col cursor-auto"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu content
            >
              <div className="mt-20 flex-1 space-y-4">
                {['Home', 'Courses', 'About', 'Contact'].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link 
                      href={getHref(item)}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-yellow-500/30 transition-all cursor-pointer"
                      onClick={() => setIsOpen(false)} // Close menu on click
                    >
                      <span className="text-lg font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">{item}</span>
                      <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-gray-500 group-hover:text-yellow-400 group-hover:bg-yellow-400/10 transition-all">
                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile Auth Footer */}
              <div className="mt-auto border-t border-white/10 pt-6">
                {!user ? (
                  <div className="space-y-3">
                     <Link href="/login" onClick={() => setIsOpen(false)} className="block cursor-pointer">
                      <div className="w-full py-3.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all text-center">
                        Login
                      </div>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)} className="block cursor-pointer">
                      <div className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold shadow-lg hover:shadow-yellow-500/20 transition-all text-center">
                        Get Started
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-lg shadow-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-white font-bold text-lg truncate">{user.name}</p>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                       {user.role === 'admin' ? (
                          <Link href="/admin/courses" onClick={() => setIsOpen(false)} className="col-span-2 cursor-pointer">
                            <div className="w-full py-2.5 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              Admin Panel
                            </div>
                          </Link>
                       ) : (
                          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="col-span-2 cursor-pointer">
                            <div className="w-full py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              Dashboard
                            </div>
                          </Link>
                       )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/profile" onClick={() => setIsOpen(false)} className="cursor-pointer">
                        <div className="w-full py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           Profile
                        </div>
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                         Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}