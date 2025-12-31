"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// --- UPDATED STAT CARD (Compact & Premium) ---
const StatCard = ({ number, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, rotateX: 10 }}
    whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
    whileHover={{ y: -5, scale: 1.05, shadow: "0px 10px 30px rgba(234, 179, 8, 0.2)" }}
    viewport={{ once: true }}
    transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
    className="relative group flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl overflow-hidden cursor-pointer bg-gray-900/40 border border-white/5"
  >
    {/* Card Background & Effects */}
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl z-0 transition-all duration-500 group-hover:border-yellow-500/50 group-hover:bg-gray-800/80"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-0"></div>
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-500/30 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

    {/* Content */}
    <h3 className="relative z-10 text-3xl md:text-4xl font-black text-white mb-1 tracking-tight group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
      <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 group-hover:from-yellow-300 group-hover:to-yellow-500 transition-all duration-300">
        {number}
      </span>
    </h3>
    <p className="relative z-10 text-gray-500 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold group-hover:text-white transition-colors">
      {label}
    </p>
  </motion.div>
);

// --- VALUE CARD (Compact) ---
const ValueCard = ({ icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
  >
    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 flex-shrink-0 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-bold text-base mb-0.5">{title}</h4>
      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

export default function AboutSection() {
  const ref = useRef(null);

  return (
    // Updated Padding: Reduced py-32 to py-16/20 to fit in frame
    <section className="relative py-12 md:py-20 bg-[#050505] overflow-hidden flex items-center justify-center min-h-[90vh] md:min-h-[80vh]" id="about">
      
      {/* Background Effects (Same as before) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-900/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        
        {/* Grid Gap Reduced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          
          {/* LEFT SIDE: Content */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-3 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10 backdrop-blur-md"
            >
              <span className="text-[10px] md:text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                About LearnR
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              // Text size slightly reduced to fit better
              className="text-3xl md:text-5xl font-black text-white leading-tight"
            >
              Revolutionizing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-600 drop-shadow-sm">English Learning</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm md:text-base leading-relaxed border-l-4 border-yellow-500/50 pl-4 bg-gradient-to-r from-white/5 to-transparent py-2 rounded-r-lg"
            >
              We blend AI technology with proven methods to create a fast, fun, and effective learning experience.
            </motion.p>

            <div className="space-y-3 pt-2">
              <ValueCard 
                delay={0.3}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Fast & Effective"
                desc="AI-driven algorithms adapt to your speed, ensuring you master concepts faster."
              />
              <ValueCard 
                 delay={0.4}
                 icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                 title="Community Driven"
                 desc="Join thousands of learners in a supportive environment to practice and grow."
              />
            </div>
          </div>

          {/* RIGHT SIDE: Visuals & Stats */}
          <div className="relative">
            {/* Background for Cards Area */}
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-800/20 to-transparent rounded-[2.5rem] border border-white/5 opacity-50 rotate-3 scale-105 pointer-events-none"></div>
            
            {/* 4 Cards Grid - Compact Gap */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
              <StatCard number="50K+" label="Active Learners" delay={0.2} />
              <StatCard number="120+" label="Expert Courses" delay={0.3} />
              <StatCard number="4.9" label="App Rating" delay={0.4} />
              <StatCard number="24/7" label="AI Support" delay={0.5} />
            </div>

            {/* Quote Box - Compact */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               whileInView={{ opacity: 1, scale: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.6 }}
               className="mt-6 p-5 bg-gradient-to-r from-gray-900 to-black border border-yellow-500/20 rounded-2xl relative overflow-hidden shadow-xl"
            >
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl"></div>
               <p className="text-sm md:text-base font-serif italic text-gray-300 relative z-10 leading-relaxed">
                 "Education is the most powerful weapon which you can use to change the world."
               </p>
               <div className="flex items-center gap-3 mt-3 border-t border-white/10 pt-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-black text-xs shadow-lg">N</div>
                  <span className="text-xs font-bold text-white tracking-wide">Nelson Mandela</span>
               </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}