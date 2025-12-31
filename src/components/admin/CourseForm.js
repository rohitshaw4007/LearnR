"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Layout, IndianRupee, Clock, BarChart, Tag, Palette, Shuffle } from "lucide-react";

export default function CourseForm({ existingData, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: existingData?.title || "",
    description: existingData?.description || "",
    price: existingData?.price || "",
    duration: existingData?.duration || "",
    level: existingData?.level || "Beginner",
    category: existingData?.category || "",
    gradient: existingData?.gradient || "from-yellow-400 to-orange-500",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = existingData 
      ? `/api/admin/courses/${existingData._id}` 
      : "/api/admin/courses";
    const method = existingData ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert("Operation failed!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Gradient Colors List
  const gradientColors = [
    "yellow-400", "orange-500", "red-500", "pink-500", 
    "purple-500", "indigo-500", "blue-500", "cyan-500", 
    "teal-500", "green-500", "gray-900", "black"
  ];

  // Auto Generate Gradient
  const generateRandomGradient = () => {
    const c1 = gradientColors[Math.floor(Math.random() * gradientColors.length)];
    const c2 = gradientColors[Math.floor(Math.random() * gradientColors.length)];
    setFormData({ ...formData, gradient: `from-${c1} to-${c2}` });
  };

  // Helper to construct gradient
  const updateGradientPart = (position, color) => {
    const currentParts = formData.gradient.split(" ");
    let fromPart = currentParts.find(p => p.startsWith("from-")) || "from-gray-900";
    let toPart = currentParts.find(p => p.startsWith("to-")) || "to-black";

    if (position === "from") fromPart = `from-${color}`;
    if (position === "to") toPart = `to-${color}`;

    setFormData({ ...formData, gradient: `${fromPart} ${toPart}` });
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.05, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      // Overlay
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }} 
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        // CHANGE: Mobile Height -> max-h-[70vh] (chota kar diya), PC -> md:max-h-[85vh] (same rakha)
        className="bg-[#0f0f0f] w-full max-w-2xl max-h-[70vh] md:max-h-[85vh] rounded-2xl md:rounded-3xl shadow-[0_0_50px_-10px_rgba(250,204,21,0.15)] border border-white/10 overflow-hidden relative flex flex-col"
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>

        {/* Header - Fixed at Top */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-yellow-400/10 rounded-lg text-yellow-400">
                <Sparkles size={20} />
             </div>
             <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
               {existingData ? "Edit Course" : "New Course"}
             </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Scrollable Area */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          <motion.div 
             variants={containerVariants}
             initial="hidden"
             animate="visible"
             className="space-y-5"
          >
            {/* Title */}
            <motion.div variants={itemVariants} className="group">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                   <Layout size={12} className="text-yellow-500" /> Title
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Complete React Mastery"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all duration-300" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
            </motion.div>

            {/* Price & Duration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={itemVariants}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                     <IndianRupee size={12} className="text-yellow-500" /> Price
                  </label>
                  <div className="relative">
                    <input 
                      required 
                      type="number" 
                      placeholder="999"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all duration-300" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    />
                  </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                     <Clock size={12} className="text-yellow-500" /> Duration
                  </label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. 3 Months"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all duration-300" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                  />
              </motion.div>
            </div>

            {/* Description */}
            <motion.div variants={itemVariants}>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                 Description
               </label>
               <textarea 
                 required 
                 rows="3" 
                 placeholder="What will students learn in this course?"
                 className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all duration-300 resize-none" 
                 value={formData.description} 
                 onChange={(e) => setFormData({...formData, description: e.target.value})} 
               />
            </motion.div>

            {/* Level & Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <motion.div variants={itemVariants}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                     <BarChart size={12} className="text-yellow-500" /> Level
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all cursor-pointer"
                      value={formData.level} 
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                    >
                        <option value="Beginner" className="bg-gray-900">Beginner</option>
                        <option value="Intermediate" className="bg-gray-900">Intermediate</option>
                        <option value="Advanced" className="bg-gray-900">Advanced</option>
                        <option value="Class 10" className="bg-gray-900">Class 10</option>
                        <option value="Class 12" className="bg-gray-900">Class 12</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
               </motion.div>

               <motion.div variants={itemVariants}>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                     <Tag size={12} className="text-yellow-500" /> Category
                  </label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Science" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all duration-300" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  />
               </motion.div>
            </div>

            {/* Gradient Design Section */}
            <motion.div variants={itemVariants} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} className="text-yellow-500" /> Gradient Theme
                    </label>
                    <button 
                        type="button" 
                        onClick={generateRandomGradient}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all text-[10px] font-bold"
                    >
                        <Shuffle size={10} /> AUTO
                    </button>
                </div>
                
                {/* Flex Column on Mobile, Row on Desktop */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 space-y-3 w-full">
                        <input 
                            required 
                            type="text" 
                            placeholder="from-yellow-400 to-black" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white/5 outline-none transition-all" 
                            value={formData.gradient} 
                            onChange={(e) => setFormData({...formData, gradient: e.target.value})} 
                        />
                        
                        {/* Gradient Builder */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 w-8">From:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {gradientColors.map(color => (
                                        <button
                                            key={`from-${color}`}
                                            type="button"
                                            onClick={() => updateGradientPart("from", color)}
                                            className={`w-5 h-5 md:w-4 md:h-4 rounded-full bg-${color.replace("gray-900", "gray-900").replace("black", "black")} ring-1 ring-white/20 hover:scale-125 transition-transform`}
                                            style={{ backgroundColor: color === 'black' ? '#000' : color === 'gray-900' ? '#111' : undefined }}
                                        >
                                            <div className={`w-full h-full rounded-full bg-${color}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 w-8">To:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {gradientColors.map(color => (
                                        <button
                                            key={`to-${color}`}
                                            type="button"
                                            onClick={() => updateGradientPart("to", color)}
                                            className="w-5 h-5 md:w-4 md:h-4 rounded-full ring-1 ring-white/20 hover:scale-125 transition-transform overflow-hidden"
                                        >
                                           <div className={`w-full h-full bg-${color}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Box - Full width on Mobile */}
                    <div className={`w-full md:w-24 h-20 md:h-24 rounded-xl bg-gradient-to-br ${formData.gradient} border border-white/20 shadow-lg flex items-center justify-center flex-shrink-0`}>
                        <span className="text-[10px] font-bold text-white bg-black/20 backdrop-blur-sm px-2 py-1 rounded">Preview</span>
                    </div>
                </div>
            </motion.div>

          </motion.div>

          {/* Footer Buttons - Fixed at Bottom of Form Content */}
          <div className="pt-8 flex justify-end gap-4 border-t border-white/5 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              disabled={loading} 
              type="submit" 
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold hover:shadow-[0_0_20px_-5px_rgba(250,204,21,0.6)] hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                   Saving...
                 </>
              ) : (existingData ? "Update Course" : "Create Course")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}