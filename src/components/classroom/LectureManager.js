"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Plus, Trash2, Edit2, Download, 
  Loader2, Sparkles, X, BookOpen, Layers, Image as ImageIcon, Search
} from "lucide-react";
import toast from "react-hot-toast";

export default function LectureManager({ courseId }) {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);

  // Form State
  const initialFormState = {
    title: "",
    chapter: "",     
    bookName: "",    
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    resourceUrl: "",
    isPreview: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetchLectures();
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

  const fetchLectures = async () => {
    try {
      const res = await fetch(`/api/admin/lectures?courseId=${courseId}`);
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

  // Prepare Edit
  const handleEdit = (lecture) => {
    setEditingId(lecture._id);
    setFormData({
        title: lecture.title,
        chapter: lecture.chapter,
        bookName: lecture.bookName,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        thumbnailUrl: lecture.thumbnailUrl,
        resourceUrl: lecture.resourceUrl || "",
        isPreview: lecture.isPreview
    });
    setIsFormOpen(true);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if(!confirm("Are you sure you want to remove this lecture?")) return;
    
    try {
        const res = await fetch(`/api/admin/lectures/${id}`, { method: "DELETE" });
        
        if(res.ok){
            toast.success("Lecture deleted successfully");
            fetchLectures(); // Refresh list
        } else {
            const data = await res.json();
            toast.error(data.error || "Failed to delete");
        }
    } catch (error) {
        toast.error("Error deleting lecture");
    }
  };

  // Auto-Fetch Logic
  const handleUrlPaste = async (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, videoUrl: url }));

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setFetchingMeta(true);
      try {
        const res = await fetch("/api/admin/lectures/meta", {
            method: "POST",
            body: JSON.stringify({ url }),
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        
        if (res.ok) {
            setFormData(prev => ({
                ...prev,
                title: prev.title || data.title, 
                thumbnailUrl: data.thumbnail_url
            }));
            toast.success("Video info fetched!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingMeta(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingId 
        ? `/api/admin/lectures/${editingId}`
        : "/api/admin/lectures";
      
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courseId })
      });
      
      if (res.ok) {
        toast.success(editingId ? "Lecture updated!" : "Lecture added!");
        closeForm();
        fetchLectures();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const closeForm = () => {
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
  }

  return (
    // Mobile: p-3 | PC: p-8
    <div className="p-3 md:p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-8">
         <div>
            {/* Mobile: text-xl | PC: text-3xl */}
            <h2 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3">
              <Video className="text-yellow-400" size={24} md-size={32} />
              <span className="md:inline">Lecture Manager</span>
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1">Manage course videos</p>
         </div>

         <div className="flex w-full md:w-auto gap-2 md:gap-3 flex-row items-center">
           {/* Search Input - Compact on Mobile */}
           <div className="relative group flex-1 md:w-80">
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-white/10 group-hover:border-yellow-400/50 rounded-lg md:rounded-xl pl-9 pr-3 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400/20 transition-all"
              />
              <Search className="absolute left-2.5 top-2 md:top-3 text-gray-500 group-hover:text-yellow-400 transition-colors" size={14} />
           </div>

           <button 
             onClick={() => setIsFormOpen(true)}
             className="bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 shadow-lg shadow-yellow-400/20 text-xs md:text-base whitespace-nowrap"
           >
             <Plus size={16} /> <span className="hidden md:inline">Add Lecture</span><span className="md:hidden">Add</span>
           </button>
         </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-400" size={32} /></div>
      ) : (
        <div className="space-y-2 md:space-y-4">
           {filteredLectures.length === 0 && (
                <div className="text-center py-10 md:py-16 text-gray-500 bg-[#111] rounded-xl md:rounded-2xl border border-dashed border-white/10">
                   <p className="text-sm md:text-base">No lectures found.</p>
                </div>
           )}

           {filteredLectures.map((lecture) => (
               <motion.div 
                 key={lecture._id}
                 layout
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 // Mobile: p-2.5 + flex-row (Compact List) | PC: p-5 + flex-row (Big Card)
                 className="group bg-[#111] border border-white/10 hover:border-yellow-400/50 p-2.5 md:p-5 rounded-xl md:rounded-2xl flex flex-row gap-3 md:gap-8 transition-all items-start md:items-stretch"
               >
                  {/* Thumbnail: Mobile (w-28, fixed width) | PC (w-72) */}
                  <div className="relative w-28 md:w-72 aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shrink-0 border border-white/5 shadow-sm md:shadow-lg">
                     <img src={lecture.thumbnailUrl || "/placeholder.jpg"} alt="thumb" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"/>
                     
                     {/* Overlay Badge */}
                     <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/80 backdrop-blur px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-md text-[8px] md:text-xs font-bold text-white flex items-center gap-1 border border-white/10">
                        <BookOpen size={8} className="text-yellow-400 md:w-3 md:h-3"/> 
                        <span className="truncate max-w-[60px] md:max-w-none">{lecture.bookName || "Gen"}</span>
                     </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col min-w-0">
                     <div className="flex flex-col gap-0.5 md:gap-1">
                        {/* Tags Row */}
                        <div className="flex items-center gap-2">
                           <span className="text-yellow-400 text-[9px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <Layers size={10} className="md:w-3 md:h-3"/> {lecture.chapter}
                           </span>
                           {lecture.isPreview && (
                             <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded text-[8px] md:text-xs font-bold uppercase">
                               Preview
                             </span>
                           )}
                        </div>
                        
                        {/* Title - Mobile: text-sm | PC: text-xl */}
                        <h3 className="text-sm md:text-xl font-bold text-white leading-tight line-clamp-2">{lecture.title}</h3>
                        
                        {/* Description - Hidden on very small mobile if needed, or line-clamp-1 */}
                        {lecture.description && (
                          <p className="text-gray-500 text-[10px] md:text-sm leading-relaxed line-clamp-1 md:line-clamp-2 hidden md:block">
                            {lecture.description}
                          </p>
                        )}
                     </div>
                     
                     {/* Bottom Actions */}
                     <div className="mt-auto pt-2 flex items-center gap-2 md:gap-3">
                        {lecture.resourceUrl && (
                           <a href={lecture.resourceUrl} target="_blank" className="text-[10px] md:text-sm font-bold text-green-400 flex items-center gap-1 md:gap-2 hover:underline bg-green-400/10 px-2 py-1 md:px-3 md:py-1.5 rounded md:rounded-lg border border-green-400/20">
                              <Download size={10} className="md:w-3.5 md:h-3.5"/> <span className="hidden md:inline">Resource</span><span className="md:hidden">PDF</span>
                           </a>
                        )}
                        <div className="flex-1"></div>
                        
                        {/* Action Buttons - Compact on Mobile */}
                        <button onClick={() => handleEdit(lecture)} className="p-1.5 md:px-3 md:py-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md md:rounded-lg transition-colors flex items-center gap-1">
                            <Edit2 size={12} className="md:w-3.5 md:h-3.5"/> <span className="hidden md:inline text-xs md:text-sm font-medium">Edit</span>
                        </button>
                        <button onClick={() => handleDelete(lecture._id)} className="p-1.5 md:px-3 md:py-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md md:rounded-lg transition-colors flex items-center gap-1">
                            <Trash2 size={12} className="md:w-3.5 md:h-3.5"/> <span className="hidden md:inline text-xs md:text-sm font-medium">Delete</span>
                        </button>
                     </div>
                  </div>
               </motion.div>
             ))}
        </div>
      )}

      {/* MODAL - Fixed Cut-off Issue */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
               // FIX: Reduced max-height on mobile (80vh) to prevent cut-off, kept 90vh on PC
               className="bg-[#0f0f0f] border border-white/10 w-full max-w-md md:max-w-3xl rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[80vh] md:max-h-[90vh]"
             >
                {/* Header */}
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-white/10 flex justify-between items-center bg-[#141414] shrink-0">
                   <h3 className="text-sm md:text-lg font-bold text-white flex items-center gap-2">
                     {editingId ? <Edit2 size={14} className="text-yellow-400 md:w-4.5 md:h-4.5"/> : <Plus size={14} className="text-yellow-400 md:w-4.5 md:h-4.5"/>}
                     {editingId ? "Edit Lecture" : "Add New Lecture"}
                   </h3>
                   <button onClick={closeForm} className="text-gray-400 hover:text-white bg-white/5 p-1 md:p-1.5 rounded-full"><X size={16} className="md:w-5 md:h-5"/></button>
                </div>
                
                {/* Form Body - Scrollable */}
                <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
                    
                    {/* URL Input */}
                    <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                            Video Link
                            {fetchingMeta && <span className="text-yellow-400 text-[9px] md:text-[10px] animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Fetching...</span>}
                        </label>
                        <div className="relative">
                            <input 
                              type="text" 
                              placeholder="YouTube Link..."
                              className="w-full bg-black/50 border border-white/10 focus:border-yellow-400 rounded-lg md:rounded-xl pl-9 pr-3 py-2 md:py-3 text-xs md:text-sm text-white outline-none transition-all"
                              value={formData.videoUrl}
                              onChange={handleUrlPaste}
                              required
                            />
                            <Video className="absolute left-3 top-2.5 md:top-3.5 text-gray-500" size={14} md-size={16}/>
                        </div>
                    </div>

                    {/* PC Split Columns / Mobile Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                        {/* Left Column (Thumb) */}
                        <div className="space-y-3 md:space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Thumbnail</label>
                                <div className="relative aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden border border-white/10 group">
                                    {formData.thumbnailUrl ? (
                                        <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                            <ImageIcon size={24} className="mb-2 md:w-8 md:h-8"/>
                                            <span className="text-[10px] md:text-xs">No Image</span>
                                        </div>
                                    )}
                                    <input 
                                        type="text" 
                                        className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur px-2 py-1.5 md:px-3 md:py-2 text-[9px] md:text-[10px] text-gray-300 outline-none border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        placeholder="Custom Thumb URL"
                                        value={formData.thumbnailUrl || ""}
                                        onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Resource / PDF</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full bg-black/50 border border-white/10 focus:border-green-400 rounded-lg md:rounded-xl pl-8 pr-3 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none"
                                        placeholder="Download URL"
                                        value={formData.resourceUrl}
                                        onChange={e => setFormData({...formData, resourceUrl: e.target.value})}
                                    />
                                    <Download className="absolute left-2.5 top-2.5 md:left-3 md:top-3 text-green-500" size={12} md-size={14}/>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Details) */}
                        <div className="space-y-3 md:space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Chapter</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-black/50 border border-white/10 focus:border-yellow-400 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-white outline-none"
                                        placeholder="e.g. Ch 01"
                                        value={formData.chapter}
                                        onChange={e => setFormData({...formData, chapter: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Book</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-black/50 border border-white/10 focus:border-yellow-400 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-white outline-none"
                                        placeholder="Subject"
                                        value={formData.bookName}
                                        onChange={e => setFormData({...formData, bookName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-black/50 border border-white/10 focus:border-yellow-400 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-white outline-none font-medium"
                                    placeholder="Lecture title..."
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Description</label>
                                <textarea 
                                    rows="2"
                                    className="w-full bg-black/50 border border-white/10 focus:border-yellow-400 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-white outline-none resize-none"
                                    placeholder="Summary..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            disabled={saving}
                            type="submit" 
                            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 md:py-3.5 rounded-lg md:rounded-xl flex items-center justify-center gap-2 transition-all text-xs md:text-sm uppercase tracking-wide"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                            {saving ? "Saving..." : (editingId ? "Update Lecture" : "Add Lecture")}
                        </button>
                    </div>
                    </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}