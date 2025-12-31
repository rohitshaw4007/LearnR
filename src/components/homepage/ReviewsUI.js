"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReviewForm from "./ReviewForm";

export default function ReviewsUI({ reviews }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const marqueeRef = useRef(null);
  
  // Safety check: Agar reviews undefined ho toh empty array use karein
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  const marqueeReviews = safeReviews.length < 5 
    ? [...safeReviews, ...safeReviews, ...safeReviews, ...safeReviews, ...safeReviews, ...safeReviews] 
    : [...safeReviews, ...safeReviews, ...safeReviews];

  const handleMouseEnter = () => {
    if (marqueeRef.current) {
      const animations = marqueeRef.current.getAnimations();
      animations.forEach(anim => anim.updatePlaybackRate(0.2)); 
    }
  };

  const handleMouseLeave = () => {
    if (marqueeRef.current) {
      const animations = marqueeRef.current.getAnimations();
      animations.forEach(anim => anim.updatePlaybackRate(1)); 
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      
      <div 
        className="w-full overflow-hidden relative group py-4 md:py-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        <div 
            ref={marqueeRef}
            className="flex gap-4 md:gap-8 animate-marquee pl-4"
        >
          {marqueeReviews.map((review, index) => (
            <div 
              key={index}
              className="group/card relative w-[280px] md:w-[400px] flex-shrink-0 cursor-pointer"
            >
                {/* FIXED: ClassName is now in a single line to prevent Hydration Mismatch */}
                <div className="h-full bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-[20px] md:rounded-3xl p-6 md:p-8 transition-all duration-500 ease-out group-hover/card:bg-gray-800/80 group-hover/card:border-yellow-500/40 group-hover/card:shadow-[0_0_50px_-15px_rgba(234,179,8,0.2)] group-hover/card:-translate-y-1 md:group-hover/card:-translate-y-2">
                   
                   <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/0 to-yellow-500/5 opacity-0 group-hover/card:opacity-100 rounded-[20px] md:rounded-3xl transition-opacity duration-700"></div>

                   <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 text-5xl md:text-7xl text-white/5 font-serif leading-none transition-colors group-hover/card:text-yellow-500/20 select-none">
                      &rdquo;
                   </div>

                   <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 relative z-10">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-inner group-hover/card:border-yellow-500 group-hover/card:text-yellow-400 transition-colors">
                        {review.name ? review.name.charAt(0) : "U"}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm md:text-base tracking-wide group-hover/card:text-yellow-400 transition-colors">{review.name}</h4>
                        <span className="text-[10px] md:text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 group-hover/card:border-yellow-500/30 group-hover/card:text-gray-300 transition-all">
                            {review.role}
                        </span>
                      </div>
                   </div>

                   <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 font-light group-hover/card:text-gray-100 transition-colors relative z-10 line-clamp-4">
                     "{review.message}"
                   </p>

                   <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-3 md:pt-4 group-hover/card:border-white/10 transition-colors relative z-10">
                      <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 ${i < (review.rating || 5) ? 'text-yellow-500 group-hover/card:scale-110' : 'text-gray-800'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                      </div>
                      <span className="text-[9px] md:text-[10px] text-gray-600 uppercase tracking-widest group-hover/card:text-yellow-500/50 transition-colors">Verified</span>
                   </div>

                </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 md:mt-12 relative z-30">
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-3 md:gap-4 px-6 py-3 md:px-10 md:py-5 bg-black border border-yellow-500/50 text-yellow-400 font-bold rounded-full text-sm md:text-lg shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)] overflow-hidden transition-all duration-300 hover:bg-yellow-500 hover:text-black hover:border-yellow-500"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></span>
          <span className="relative z-10 flex items-center gap-2 md:gap-3">
            <span className="text-lg md:text-2xl">✍️</span> Write a Review
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            ></motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm md:max-w-md z-50" 
            >
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>

               <ReviewForm onClose={() => setIsModalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}