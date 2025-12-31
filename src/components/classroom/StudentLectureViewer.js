"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Youtube, Download, Search, 
  ArrowLeft, Clock, BookOpen, Layers, MonitorPlay 
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentLectureViewer({ courseId }) {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null); // For Details View
  const [isPlaying, setIsPlaying] = useState(false); // For "Watch Here"

  // Fetch Lectures
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/lectures`);
        const data = await res.json();
        if (data.lectures) {
          setLectures(data.lectures);
          setFilteredLectures(data.lectures);
        }
      } catch (error) {
        toast.error("Failed to load lectures");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchLectures();
  }, [courseId]);

  // Search Logic
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLectures(lectures);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = lectures.filter(item => 
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.chapter?.toLowerCase().includes(lowerQuery) ||
        item.bookName?.toLowerCase().includes(lowerQuery)
      );
      setFilteredLectures(filtered);
    }
  }, [searchQuery, lectures]);

  // Helper to get YouTube Embed URL (Updated for Mobile & All Link Types)
  const getEmbedUrl = (url) => {
    if (!url) return "";
    
    // Robust Regex to handle m.youtube, youtu.be, shorts, embedded, etc.
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) return "";

    // Added playsinline=1 (Fixes mobile playback issues)
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-3 md:p-8 pb-20 md:pb-8">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LECTURE LIST */}
        {!selectedLecture ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-7xl mx-auto space-y-6 md:space-y-8"
          >
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-4 md:pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tight text-white mb-1 md:mb-2">
                  Course <span className="text-yellow-400">Lectures</span>
                </h1>
                <p className="text-gray-400 text-xs md:text-sm lg:text-base">Explore your syllabus and start learning.</p>
              </div>

              {/* Modern Search Bar */}
              <div className="relative group w-full md:w-96">
                <input 
                  type="text"
                  placeholder="Search topic, chapter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 group-hover:border-yellow-400/50 rounded-xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-sm md:text-base text-white outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all placeholder:text-gray-600"
                />
                <Search className="absolute left-3 md:left-4 top-3.5 md:top-4 text-gray-500 group-hover:text-yellow-400 transition-colors" size={18} md-size={20} />
              </div>
            </div>

            {/* Grid List */}
            {loading ? (
              <div className="text-center py-20 text-gray-500 animate-pulse">Loading content...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {filteredLectures.map((lecture, index) => (
                   <motion.div 
                     key={lecture._id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: index * 0.05 }}
                     onClick={() => {
                        setSelectedLecture(lecture);
                        setIsPlaying(false);
                     }}
                     className="group bg-[#111] border border-white/5 hover:border-yellow-400/50 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:shadow-yellow-400/10 active:scale-95 md:active:scale-100"
                   >
                      {/* Thumbnail Area */}
                      <div className="relative aspect-video bg-black overflow-hidden">
                         <img 
                           src={lecture.thumbnailUrl || "/placeholder.jpg"} 
                           alt={lecture.title}
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"/>
                         
                         {/* Play Button Overlay */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                            <div className="bg-yellow-400 text-black rounded-full p-3 md:p-4 shadow-xl shadow-yellow-400/20">
                               <Play fill="currentColor" size={20} md-size={24}/>
                            </div>
                         </div>

                         {/* Badges */}
                         <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                               <Layers size={10} className="text-yellow-400"/> {lecture.chapter}
                            </span>
                         </div>
                         <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[10px] md:text-xs font-bold text-white flex items-center gap-1">
                            <Clock size={10} md-size={12}/> 24:00
                         </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 md:p-5 space-y-1.5 md:space-y-2">
                         <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <BookOpen size={10} md-size={12}/> {lecture.bookName || "General"}
                         </div>
                         <h3 className="text-base md:text-lg font-bold text-white leading-snug group-hover:text-yellow-400 transition-colors line-clamp-2">
                            {lecture.title}
                         </h3>
                         <p className="text-gray-500 text-xs md:text-sm line-clamp-2">
                            {lecture.description || "No description available for this lecture."}
                         </p>
                      </div>
                   </motion.div>
                 ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* VIEW 2: DETAILS & PLAYER */
          <motion.div 
            key="details"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="max-w-6xl mx-auto"
          >
             {/* Back Button */}
             <button 
               onClick={() => setSelectedLecture(null)}
               className="flex items-center gap-2 text-sm md:text-base text-gray-400 hover:text-white mb-4 md:mb-6 transition-colors group px-1"
             >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform"/> Back to Lectures
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Left: Player Area (Takes 2 columns) */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                   {/* Main Player Container */}
                   <div className="relative aspect-video bg-black rounded-xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-yellow-400/5 group">
                      {isPlaying ? (
                         <iframe 
                           src={getEmbedUrl(selectedLecture.videoUrl)} 
                           className="w-full h-full"
                           allowFullScreen
                           title={selectedLecture.title}
                           allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                         />
                      ) : (
                         <>
                            <img 
                              src={selectedLecture.thumbnailUrl || "/placeholder.jpg"} 
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"/>
                            
                            {/* Big Play Button */}
                            <button 
                              onClick={() => setIsPlaying(true)}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full p-5 md:p-8 transition-all hover:scale-110 shadow-[0_0_40px_rgba(250,204,21,0.4)]"
                            >
                               <Play fill="currentColor" className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                         </>
                      )}
                   </div>

                   {/* Video Meta */}
                   <div className="px-1 md:px-0">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="text-yellow-400 font-bold uppercase tracking-widest text-[10px] md:text-sm border border-yellow-400/20 px-2 py-0.5 md:py-1 rounded">
                            {selectedLecture.chapter}
                         </span>
                         <span className="text-gray-500 text-xs md:text-sm font-medium">{selectedLecture.bookName}</span>
                      </div>
                      <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-white mb-2 md:mb-3 leading-tight">{selectedLecture.title}</h1>
                      <p className="text-gray-400 text-xs md:text-sm lg:text-lg leading-relaxed">
                         {selectedLecture.description || "Dive deep into this topic with our comprehensive video lecture. Make sure to check the resources below."}
                      </p>
                   </div>
                </div>

                {/* Right: Actions & Details (Takes 1 column) */}
                <div className="space-y-6">
                   <div className="bg-[#111] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 sticky top-4 md:top-8">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-0 md:mb-2">Actions</h3>
                      
                      {/* BUTTON 1: WATCH HERE (Internal Player) */}
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className={`w-full py-3 md:py-4 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 md:gap-3 transition-all ${isPlaying ? 'bg-white/10 text-white cursor-default' : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20'}`}
                      >
                         <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                         {isPlaying ? "Now Playing" : "Watch Here"}
                      </button>

                      {/* BUTTON 2: WATCH ON YOUTUBE */}
                      <a 
                        href={selectedLecture.videoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-[#ff0000] hover:bg-[#cc0000] text-white py-3 md:py-4 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 md:gap-3 transition-all shadow-lg shadow-red-500/20"
                      >
                         <Youtube className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                         Watch on YouTube
                      </a>

                      {/* BUTTON 3: DOWNLOAD RESOURCE */}
                      {selectedLecture.resourceUrl ? (
                         <a 
                           href={selectedLecture.resourceUrl}
                           target="_blank"
                           className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-green-500/50 text-white py-3 md:py-4 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 md:gap-3 transition-all group"
                         >
                            <Download className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-green-400 transition-colors"/>
                            Download Material
                         </a>
                      ) : (
                         <button disabled className="w-full bg-white/5 text-gray-600 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 md:gap-3 cursor-not-allowed">
                            <Download className="w-4 h-4 md:w-5 md:h-5" />
                            No Material
                         </button>
                      )}

                      <div className="pt-4 md:pt-6 border-t border-white/10">
                         <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 md:mb-3">Next Up</h4>
                         <div className="space-y-2 md:space-y-3">
                            {/* Simple Next Up List */}
                            {filteredLectures.slice(0, 3).map(l => (
                               <div key={l._id} onClick={() => {setSelectedLecture(l); setIsPlaying(false);}} className="flex gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                  <div className="w-16 h-10 md:w-16 md:h-10 bg-gray-800 rounded overflow-hidden shrink-0">
                                     <img src={l.thumbnailUrl} className="w-full h-full object-cover"/>
                                  </div>
                                  <div className="min-w-0 flex flex-col justify-center">
                                     <p className="text-xs md:text-sm text-white font-medium truncate">{l.title}</p>
                                     <p className="text-[10px] md:text-xs text-gray-500">{l.chapter}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}