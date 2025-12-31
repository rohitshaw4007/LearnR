"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReviewForm from "./ReviewForm";

export default function ToggleReviewSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-20 w-full flex flex-col items-center justify-center relative z-20">
      
      {/* The Button (Only visible when form is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative px-8 py-4 bg-black border border-yellow-500/30 rounded-full overflow-hidden hover:border-yellow-400 transition-colors duration-300"
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              
              <span className="relative z-10 flex items-center gap-3 text-white font-bold tracking-wider uppercase text-sm group-hover:text-yellow-400 transition-colors">
                <span className="text-xl">✍️</span> Write a Review
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Form (Slides down smoothly) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="w-full overflow-hidden"
          >
            <div className="py-10 px-4">
              <ReviewForm onClose={() => setIsOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}