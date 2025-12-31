"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Link as LinkIcon, Plus, Trash2, Edit2, 
  FolderOpen, Loader2, Search, X, Eye, ExternalLink, ArrowLeft, ChevronDown 
} from "lucide-react";

export default function MaterialsManager({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CHANGED: Logic reversed. Instead of tracking collapsed, we track EXPANDED.
  // Default value {} means all chapters are CLOSED initially.
  const [expandedChapters, setExpandedChapters] = useState({});

  // States for UI Logic
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState(null); 

  // Form State
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({
    syllabusId: "",
    title: "",
    type: "PDF",
    fileUrl: "", 
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const syllabusRes = await fetch(`/api/admin/courses/${courseId}/syllabus`);
      const syllabusData = await syllabusRes.json();
      
      const materialsRes = await fetch(`/api/admin/materials?courseId=${courseId}`);
      const materialsData = await materialsRes.json();

      setSyllabus(syllabusData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Function: Switches the state of a specific chapter
  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId] // Toggle true/false
    }));
  };

  const getFilteredData = () => {
    if (!searchQuery) return syllabus;
    const lowerQuery = searchQuery.toLowerCase();
    
    return syllabus.filter(chap => {
        const chapterMatch = chap.chapterName.toLowerCase().includes(lowerQuery);
        const hasMatchingMaterials = materials.some(
            m => m.syllabusId?._id === chap._id && m.title.toLowerCase().includes(lowerQuery)
        );
        return chapterMatch || hasMatchingMaterials;
    });
  };

  const getMaterialsForChapter = (chapId) => {
    let filtered = materials.filter((m) => m.syllabusId?._id === chapId);
    if (searchQuery) {
        filtered = filtered.filter(m => 
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            syllabus.find(s => s._id === chapId)?.chapterName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    return filtered;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.syllabusId || !formData.title || !formData.fileUrl) return;

    setSubmitting(true);
    try {
      const url = editingId 
        ? `/api/admin/materials/${editingId}` 
        : "/api/admin/materials";            
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courseId }),
      });

      if (res.ok) {
        setFormData({ syllabusId: "", title: "", type: "PDF", fileUrl: "" });
        setEditingId(null);
        setIsFormOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Operation failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (material) => {
      setFormData({
          syllabusId: material.syllabusId._id,
          title: material.title,
          type: material.type,
          fileUrl: material.fileUrl
      });
      setEditingId(material._id);
      setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this note?")) return;
      try {
          const res = await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
          if(res.ok) setMaterials(prev => prev.filter(m => m._id !== id));
      } catch (error) {
          console.error("Delete failed", error);
      }
  };

  const getEmbedUrl = (url) => {
    if (url.includes("drive.google.com")) {
       const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
       if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const filteredSyllabus = getFilteredData();

  if (loading) return <div className="p-10 text-center text-yellow-400 animate-pulse">Loading Library...</div>;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto min-h-screen pb-24 md:pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Study Materials</h1>
            <p className="text-gray-500 text-sm md:text-base mt-1">Manage notes, PDFs & links</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl md:rounded-full focus:border-yellow-400 outline-none transition-all text-sm md:text-base"
                />
            </div>

            <button 
                onClick={() => {
                    setEditingId(null);
                    setFormData({ syllabusId: "", title: "", type: "PDF", fileUrl: "" });
                    setIsFormOpen(true);
                }}
                className="flex items-center gap-2 bg-yellow-400 text-black px-4 md:px-5 py-3 rounded-xl md:rounded-full font-bold hover:bg-yellow-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.3)] shrink-0"
            >
                <Plus size={20} /> <span className="hidden md:inline">Upload</span>
            </button>
        </div>
      </div>

      {/* MATERIALS LIST (Accordions) */}
      <div className="space-y-4 md:space-y-6">
        {filteredSyllabus.length === 0 ? (
           <div className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-white/10 mx-4 md:mx-0">
              <p className="text-gray-500 text-sm">No matching content.</p>
           </div>
        ) : (
          filteredSyllabus.map((chapter, index) => {
             const chapterMaterials = getMaterialsForChapter(chapter._id);
             
             // UPDATED LOGIC: 
             // 1. If searching, Force OPEN (true).
             // 2. Otherwise check 'expandedChapters' state.
             // 3. If undefined in state, it is FALSE (Closed by default).
             const isExpanded = searchQuery ? true : expandedChapters[chapter._id];

             if (searchQuery && chapterMaterials.length === 0 && !chapter.chapterName.toLowerCase().includes(searchQuery.toLowerCase())) return null;

             return (
               <motion.div 
                 key={chapter._id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
                 className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/50"
               >
                  {/* CLICKABLE CHAPTER HEADER */}
                  <div 
                    onClick={() => toggleChapter(chapter._id)}
                    className="bg-[#111] p-4 flex justify-between items-center border-b border-white/5 cursor-pointer hover:bg-[#161616] transition-colors group select-none"
                  >
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm md:text-base">
                           {chapter.chapterNo}
                        </div>
                        <div>
                           <h3 className="font-bold text-sm md:text-lg text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">
                             {chapter.chapterName}
                           </h3>
                           <p className="text-[10px] md:text-xs text-gray-500">
                             {chapterMaterials.length} Resources
                           </p>
                        </div>
                     </div>
                     {/* Icon rotates based on 'isExpanded' */}
                     <motion.div
                       animate={{ rotate: isExpanded ? 180 : 0 }}
                       transition={{ duration: 0.3 }}
                       className="text-gray-500 group-hover:text-white"
                     >
                       <ChevronDown size={20} />
                     </motion.div>
                  </div>

                  {/* COLLAPSIBLE CONTENT */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                         <div className="p-3 md:p-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {chapterMaterials.length > 0 ? (
                               chapterMaterials.map((mat) => (
                                  <div 
                                     key={mat._id} 
                                     onClick={() => setPreviewMaterial(mat)}
                                     className="group relative bg-[#161616] p-3 md:p-4 rounded-xl border border-white/5 hover:border-yellow-400/50 transition-all hover:bg-[#1a1a1a] cursor-pointer active:scale-[0.98]"
                                  >
                                     <div className="flex justify-between items-start mb-2 md:mb-3">
                                        <div className={`p-1.5 md:p-2 rounded-lg ${mat.type === 'PDF' ? 'bg-red-500/10 text-red-500' : mat.type === 'Image' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                           {mat.type === 'PDF' ? <FileText size={14} className="md:w-5 md:h-5"/> : mat.type === 'Image' ? <Eye size={14} className="md:w-5 md:h-5"/> : <LinkIcon size={14} className="md:w-5 md:h-5"/>}
                                        </div>
                                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button 
                                               onClick={(e) => { e.stopPropagation(); handleEditClick(mat); }}
                                               className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                           >
                                               <Edit2 size={12} className="md:w-4 md:h-4"/>
                                           </button>
                                           <button 
                                               onClick={(e) => { e.stopPropagation(); handleDelete(mat._id); }}
                                               className="p-1.5 md:p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500"
                                           >
                                               <Trash2 size={12} className="md:w-4 md:h-4"/>
                                           </button>
                                        </div>
                                     </div>
                                     <h4 className="font-bold text-gray-200 text-xs md:text-sm line-clamp-2 mb-1 leading-tight">{mat.title}</h4>
                                     <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                        {mat.type} • {new Date(mat.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric'})}
                                     </p>
                                  </div>
                               ))
                            ) : (
                               <div className="col-span-full py-4 md:py-6 flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/5 rounded-xl bg-black/20">
                                  <FolderOpen size={20} className="mb-2 opacity-50"/>
                                  <p className="text-xs">No materials here.</p>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </motion.div>
             );
          })
        )}
      </div>

      {/* FORM MODAL (Mobile Bottom Sheet) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-end md:items-center justify-center md:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#111] border-t md:border border-white/10 w-full h-auto max-h-[85vh] md:max-h-[90vh] md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl relative flex flex-col"
            >
              <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                 <h2 className="text-lg md:text-2xl font-bold text-white">
                    {editingId ? "Edit Material" : "Add Resource"}
                 </h2>
                 <button onClick={() => setIsFormOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                    <X size={20}/>
                 </button>
              </div>
              
              <div className="p-5 md:p-6 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1">Select Chapter</label>
                      <select 
                        value={formData.syllabusId}
                        onChange={(e) => setFormData({...formData, syllabusId: e.target.value})}
                        className="w-full bg-black border border-white/20 text-white py-3 px-4 md:p-4 rounded-xl mt-1.5 focus:border-yellow-400 outline-none appearance-none text-sm md:text-base"
                        required
                      >
                          <option value="">-- Choose Chapter --</option>
                          {syllabus.map((chap) => (
                            <option key={chap._id} value={chap._id}>
                              {chap.chapterNo}. {chap.chapterName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1">Title</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Notes Part 1"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-black border border-white/20 text-white py-3 px-4 md:p-4 rounded-xl mt-1.5 focus:border-yellow-400 outline-none text-sm md:text-base"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="col-span-1">
                          <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                          <select 
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full bg-black border border-white/20 text-white py-3 px-2 md:p-4 rounded-xl mt-1.5 focus:border-yellow-400 outline-none appearance-none text-sm md:text-base text-center"
                          >
                            <option value="PDF">PDF</option>
                            <option value="Link">Link</option>
                            <option value="Image">IMG</option>
                          </select>
                      </div>
                      <div className="col-span-2">
                          <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1">URL</label>
                          <input 
                            type="url" 
                            placeholder="https://..."
                            value={formData.fileUrl}
                            onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                            className="w-full bg-black border border-white/20 text-white py-3 px-4 md:p-4 rounded-xl mt-1.5 focus:border-yellow-400 outline-none text-sm md:text-base"
                            required
                          />
                      </div>
                    </div>
                    <button 
                      disabled={submitting}
                      className="w-full bg-yellow-400 text-black font-bold py-3 md:py-4 rounded-xl mt-4 hover:bg-yellow-300 transition-colors disabled:opacity-50 text-sm md:text-lg"
                    >
                      {submitting ? <Loader2 className="animate-spin mx-auto"/> : (editingId ? "Update" : "Upload Now")}
                    </button>
                    <div className="h-6 md:hidden"></div>
                  </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center md:bg-black/90 md:p-4"
             onClick={() => setPreviewMaterial(null)}
          >
             <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="w-full h-full md:max-w-5xl md:h-[85vh] bg-[#111] md:rounded-2xl overflow-hidden flex flex-col relative shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
             >
                <div className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4 md:px-6">
                   <div className="flex items-center gap-3 overflow-hidden">
                       <button onClick={() => setPreviewMaterial(null)} className="md:hidden text-gray-400">
                          <ArrowLeft size={24}/>
                       </button>
                       <h3 className="font-bold text-white truncate max-w-[200px] md:max-w-md text-sm md:text-base">
                          {previewMaterial.title}
                       </h3>
                   </div>
                   <div className="flex items-center gap-3 md:gap-4">
                      <a href={previewMaterial.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs md:text-sm font-bold flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-full">
                          Open <ExternalLink size={12}/>
                      </a>
                      <button onClick={() => setPreviewMaterial(null)} className="hidden md:block p-2 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-500 text-white transition-colors">
                          <X size={18}/>
                      </button>
                   </div>
                </div>
                
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                   {previewMaterial.fileUrl.includes("drive.google.com") ? (
                       <iframe 
                           src={getEmbedUrl(previewMaterial.fileUrl)} 
                           className="w-full h-full border-0"
                           title="Drive Preview"
                           allow="autoplay"
                       />
                   ) : (
                       <>
                           {previewMaterial.type === 'PDF' ? (
                               <iframe 
                                   src={`https://docs.google.com/gview?url=${previewMaterial.fileUrl}&embedded=true`} 
                                   className="w-full h-full border-0"
                                   title="PDF Preview"
                               />
                           ) : previewMaterial.type === 'Image' ? (
                               <img 
                                   src={previewMaterial.fileUrl} 
                                   alt="Preview" 
                                   className="w-full h-full object-contain" 
                               />
                           ) : (
                               <div className="flex flex-col items-center text-gray-500 p-4 text-center">
                                   <LinkIcon size={48} className="mb-4 text-blue-500 opacity-50" />
                                   <p className="mb-4 text-sm">External Link Preview Unavailable</p>
                                   <a href={previewMaterial.fileUrl} target="_blank" rel="noreferrer" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-sm">
                                       Open Link in Browser
                                   </a>
                               </div>
                           )}
                       </>
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}