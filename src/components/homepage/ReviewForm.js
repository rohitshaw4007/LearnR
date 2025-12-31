"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ReviewForm({ onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    message: "",
    rating: 5
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: "", role: "", message: "", rating: 5 });
        router.refresh();
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs md:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-all duration-300";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[50px] rounded-full pointer-events-none"></div>

      <div className="relative border border-white/10 p-5 md:p-6 shadow-2xl">
        
        <div className="text-center mb-5 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">ADD REVIEW</h3>
          <p className="text-gray-500 text-[10px] md:text-xs mt-1">Share your experience with us.</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl text-center py-10"
          >
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-lg font-bold">Review Posted!</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Name</label>
                <input 
                  type="text" required
                  className={inputStyle}
                  placeholder="Rahul"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Class/Role</label>
                <input 
                  type="text" required
                  className={inputStyle}
                  placeholder="Class 10"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Rating</label>
              <div className="flex gap-1 bg-white/5 w-full justify-center py-2 rounded-lg border border-white/5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star} type="button"
                    onClick={() => setFormData({...formData, rating: star})}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-xl md:text-2xl transition-transform hover:scale-110 focus:outline-none px-1"
                  >
                    <span className={star <= (hoverRating || formData.rating) ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" : "text-gray-700"}>★</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Message</label>
              <textarea 
                required rows="3"
                className={inputStyle}
                placeholder="Write something..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 md:py-3 rounded-lg text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-yellow-500/20 transition-all mt-1"
            >
              {loading ? "..." : "Submit"}
            </motion.button>
            
          </form>
        )}
      </div>
    </div>
  );
}