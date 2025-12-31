"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; // Added Link import

export default function CoursesClient({ initialCourses }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter Logic: Search Text + Category
  const filteredCourses = initialCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(query.toLowerCase()) || 
                          course.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Extract Unique Categories
  const categories = ["All", ...new Set(initialCourses.map(c => c.category))];

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
      
      {/* --- SEARCH & FILTER SECTION --- */}
      {/* Changed: Mobile par spacing kam ki (mb-8 instead of mb-16) */}
      <div className="flex flex-col items-center justify-center -mt-4 md:-mt-8 mb-8 md:mb-16 space-y-6 md:space-y-8">
        
        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-2xl group px-2 md:px-0"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-gray-900 border border-white/10 rounded-full p-1.5 md:p-2 shadow-2xl">
                <div className="pl-3 md:pl-4 pr-2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  // Changed: Mobile font size optimized
                  className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none h-9 md:h-12 text-sm md:text-lg"
                />
                <button className="hidden md:block bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm font-bold transition-all border border-white/5">
                    Search
                </button>
            </div>
        </motion.div>

        {/* Category Pills (App-like Scroll on Mobile) */}
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            // Changed: Mobile par 'flex-nowrap' aur 'justify-start' taaki scroll ho sake
            className="flex md:flex-wrap justify-start md:justify-center gap-2 md:gap-3 px-1 min-w-max md:min-w-0"
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all duration-300 whitespace-nowrap ${
                            selectedCategory === cat 
                            ? "bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.4)]" 
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>
        </div>
      </div>

      {/* --- COURSES GRID --- */}
      {filteredCourses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-10 md:py-20"
          >
              <div className="inline-block p-4 md:p-6 rounded-full bg-white/5 mb-4">
                  <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">No courses found</h3>
              <p className="text-sm md:text-base text-gray-500 mt-2">Try searching for something else.</p>
          </motion.div>
      ) : (
          <motion.div 
            layout
            // Changed: Mobile gap reduced (gap-4)
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 pb-12 md:pb-20"
          >
            <AnimatePresence>
                {filteredCourses.map((course) => (
                    <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        key={course._id}
                        className="h-full" // Layout fix for link wrapper
                    >
                        {/* Wrapped Card in Link */}
                        <Link href={`/courses/${course._id}`} className="block h-full">
                            <div className="group relative bg-gray-900/40 border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                                {/* Gradient Bar */}
                                <div className={`h-1.5 md:h-2 w-full bg-gradient-to-r ${course.gradient || 'from-yellow-500 to-orange-500'}`}></div>

                                {/* Changed: Padding reduced for mobile (p-5 instead of p-8) */}
                                <div className="p-5 md:p-8 flex flex-col flex-grow space-y-3 md:space-y-4">
                                    
                                    {/* Tags */}
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                            {course.category}
                                        </span>
                                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                                            <span className="text-yellow-400 text-[10px] md:text-xs font-bold">★ {course.rating}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow">
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-3">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-gray-500 border-t border-white/5 pt-3 md:pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {course.duration}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            {course.level}
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-1 md:pt-2 mt-auto">
                                        <div>
                                            <span className="text-gray-500 text-[10px] md:text-xs">Fees</span>
                                            <p className="text-white font-bold text-base md:text-lg">₹{course.price}</p>
                                        </div>
                                        <button className="bg-white text-black font-bold text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-yellow-500/20">
                                            Enroll
                                        </button>
                                    </div>
                                </div>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
      )}

    </div>
  );
}