"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Link as LinkIcon, Download, 
  FolderOpen, Search, X, Eye, ExternalLink, ArrowLeft, ChevronDown 
} from "lucide-react";

export default function StudentMaterialsViewer({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default Expanded Logic: Open automatically on search
  const [expandedChapters, setExpandedChapters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState(null); 

  useEffect(() => {
    if(courseId) fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Student Routes use kar rahe hain
      const syllabusRes = await fetch(`/api/courses/${courseId}/syllabus`);
      const syllabusData = await syllabusRes.json();
      
      const materialsRes = await fetch(`/api/courses/${courseId}/materials`);
      const materialsData = await materialsRes.json();

      setSyllabus(syllabusData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- DOWNLOAD LOGIC ---
  const handleDownload = (e, url) => {
    e.stopPropagation(); // Card open hone se roko
    
    // Check if it is a Google Drive Link
    if (url.includes("drive.google.com")) {
       const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
       if (match && match[1]) {
          // Force Download Link format
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
          window.open(downloadUrl, "_blank");
       } else {
          // Fallback
          window.open(url, "_blank");
       }
    } else {
       // Direct File Link
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', '');
       link.setAttribute('target', '_blank');
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    }
  };

  // Toggle Function
  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId] 
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

  const getEmbedUrl = (url) => {
    if (url.includes("drive.google.com")) {
       const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
       if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const filteredSyllabus = getFilteredData();

  if (loading) return <div className="p-10 text-center text-yellow-400 animate-pulse">Loading Materials...</div>;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto min-h-screen pb-24 md:pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Study Materials</h1>
            <p className="text-gray-500 text-sm md:text-base mt-1">Access course notes & PDFs</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl md:rounded-full focus:border-yellow-400 outline-none transition-all text-sm md:text-base"
                />
            </div>
        </div>
      </div>

      {/* MATERIALS LIST (Accordions) */}
      <div className="space-y-4 md:space-y-6">
        {filteredSyllabus.length === 0 ? (
           <div className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-white/10 mx-4 md:mx-0">
              <p className="text-gray-500 text-sm">No materials found.</p>
           </div>
        ) : (
          filteredSyllabus.map((chapter, index) => {
             const chapterMaterials = getMaterialsForChapter(chapter._id);
             
             // Search hone par Force Open
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
                                        
                                        {/* Direct Download Button */}
                                        <button 
                                            onClick={(e) => handleDownload(e, mat.fileUrl)}
                                            className="p-1.5 md:p-2 bg-white/5 hover:bg-green-500/20 rounded-lg text-gray-400 hover:text-green-400 transition-colors z-10"
                                            title="Download Now"
                                        >
                                            <Download size={14} className="md:w-5 md:h-5"/>
                                        </button>
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
                      {/* Also Download Option in Preview */}
                      <button 
                        onClick={(e) => handleDownload(e, previewMaterial.fileUrl)}
                        className="text-green-400 hover:text-green-300 text-xs md:text-sm font-bold flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded-full"
                      >
                         Download <Download size={12}/>
                      </button>
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
                                   <p className="mb-4 text-sm">External Link</p>
                                   <a href={previewMaterial.fileUrl} target="_blank" rel="noreferrer" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-sm">
                                       Open Link
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