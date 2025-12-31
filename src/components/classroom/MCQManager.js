"use client";
import { useState, useEffect } from "react";
import { 
  Search, Plus, Calendar, Clock, CheckSquare, 
  PlayCircle, StopCircle, Edit, Loader2, X, ArrowLeft,
  Download, FileText, CheckCircle, MonitorPlay, User, 
  AlertCircle, Trash2, Power, BarChart2
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf"; 

// IMPORT THE COMPONENTS
import MCQEditor from "./MCQEditor";
import TestAnalyticsDashboard from "./TestAnalyticsDashboard"; 
import LiveExamMonitor from "./LiveExamMonitor"; // <--- 1. NEW IMPORT

export default function MCQManager({ courseId, onBack }) {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false); 
  
  // Selection States
  const [selectedTestId, setSelectedTestId] = useState(null); // For Editor (Draft/Scheduled)
  const [selectedAnalyticsTestId, setSelectedAnalyticsTestId] = useState(null); // For Analytics (Completed)
  const [selectedLiveTestId, setSelectedLiveTestId] = useState(null); // <--- 2. NEW STATE FOR LIVE
  
  const [selectedTestForDownload, setSelectedTestForDownload] = useState(null); 
  const [selectedTestForPreview, setSelectedTestForPreview] = useState(null); 
  const [isDownloading, setIsDownloading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "", description: "", scheduledDate: "", scheduledTime: "", duration: 60, totalMarks: 100, isManualStart: false,
  });

  // 1. FETCH TESTS
  const fetchTests = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/tests?type=mcq`);
      if (res.ok) {
          const data = await res.json();
          setTests(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Agar koi specific page open nahi hai, tabhi refresh karein
    if(courseId && !selectedTestId && !selectedAnalyticsTestId && !selectedLiveTestId) fetchTests(); 
  }, [courseId, selectedTestId, selectedAnalyticsTestId, selectedLiveTestId]);

  // ... (handleCreate, toggleStatus, handleDelete, generatePDF functions same rahenge) ...
  // (Main code ki baki functions me koi change nahi hai, unhe waisa hi rakhein)
  
  // 2. CREATE TEST HANDLER
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "mcq", status: "draft" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create test");
      
      toast.success("Exam Draft Created!");
      setIsModalOpen(false);
      setSelectedTestId(data._id);
      setFormData({ title: "", description: "", scheduledDate: "", scheduledTime: "", duration: 60, totalMarks: 100, isManualStart: false });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. START/STOP TOGGLE
  const toggleStatus = async (testId, newStatus) => {
    try {
        const res = await fetch(`/api/admin/tests/${testId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        
        if(res.ok) {
            toast.success(newStatus === 'live' ? "Exam Started Successfully!" : "Exam Ended!");
            fetchTests();
            if(selectedTestForPreview && selectedTestForPreview._id === testId) {
                setSelectedTestForPreview(prev => ({...prev, status: newStatus}));
            }
        } else {
            toast.error("Failed to update status");
        }
    } catch (err) { toast.error("Action failed"); }
  };

  // 4. DELETE TEST
  const handleDelete = async (testId) => {
      if(!confirm("Are you sure you want to CANCEL and DELETE this exam? This action cannot be undone.")) return;
      try {
          const res = await fetch(`/api/admin/tests/${testId}`, { method: "DELETE" });
          if(res.ok) {
              toast.success("Exam Cancelled & Deleted!");
              setPreviewModalOpen(false);
              fetchTests();
          } else {
              toast.error("Failed to delete exam");
          }
      } catch(err) { toast.error("Error deleting exam"); }
  };

  // 5. PDF GENERATOR
  const generatePDF = async (type) => {
    if (!selectedTestForDownload) return;
    setIsDownloading(true);
    try {
        let testData = selectedTestForDownload;
        if(!testData.questions || testData.questions.length === 0) {
             const res = await fetch(`/api/admin/tests/${testData._id}`);
             if(res.ok) testData = await res.json();
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Header
        doc.setFillColor(255, 204, 0); 
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(0, 0, 0); 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14); 
        doc.text("LearnR Academy", 12, 13);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Exam Paper", pageWidth - 30, 13);

        // Details
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "bold");
        doc.setFontSize(16); 
        doc.text(testData.title || "Untitled Exam", 12, 32);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9); 
        doc.setTextColor(40, 40, 40);
        const dateStr = new Date(testData.scheduledAt).toLocaleDateString();
        doc.text(`Date: ${dateStr}  |  Time: ${testData.duration} Mins  |  Marks: ${testData.totalMarks}`, 12, 38);
        doc.setDrawColor(255, 204, 0); 
        doc.setLineWidth(0.5);
        doc.line(12, 42, pageWidth - 12, 42);

        // Questions
        let yPos = 50;
        testData.questions?.forEach((q, index) => {
            if (yPos > pageHeight - 25) {
                doc.addPage();
                yPos = 15;
                doc.setFillColor(255, 204, 0); 
                doc.rect(0, 0, pageWidth, 3, 'F');
            }
            doc.setFont("times", "bold");
            doc.setFontSize(10); 
            doc.setTextColor(0, 0, 0);
            const questionTitle = `Q${index + 1}. ${q.questionText}`;
            const splitTitle = doc.splitTextToSize(questionTitle, pageWidth - 24);
            doc.text(splitTitle, 12, yPos);
            yPos += (splitTitle.length * 4.5) + 2; 

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9); 
            doc.setTextColor(20, 20, 20);
            let isShortOptions = q.options.every(opt => opt.length < 35);
            if (isShortOptions) {
                q.options.forEach((opt, optIndex) => {
                   const optLabel = String.fromCharCode(65 + optIndex);
                   const xOffset = (optIndex % 2 === 0) ? 16 : (pageWidth / 2) + 5;
                   if(optIndex % 2 === 0 && optIndex > 0) yPos += 4.5; 
                   doc.text(`(${optLabel}) ${opt}`, xOffset, yPos);
                });
                yPos += 5; 
            } else {
                q.options.forEach((opt, optIndex) => {
                    const optLabel = String.fromCharCode(65 + optIndex); 
                    doc.text(`(${optLabel}) ${opt}`, 16, yPos);
                    yPos += 4.5;
                });
            }

            if (type === 'solution') {
                yPos += 1;
                doc.setFillColor(255, 250, 225); 
                let descLines = [];
                if(q.description) descLines = doc.splitTextToSize(`Exp: ${q.description.replace(/<[^>]*>?/gm, '')}`, pageWidth - 30);
                const boxHeight = 6 + (descLines.length * 3.5);
                if (yPos + boxHeight > pageHeight - 10) { doc.addPage(); yPos = 15; }
                doc.rect(12, yPos, pageWidth - 24, boxHeight, 'F');
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                const correctLabel = String.fromCharCode(65 + q.correctOption);
                doc.text(`Ans: (${correctLabel})`, 14, yPos + 4);
                if (q.description) {
                   doc.setFont("helvetica", "normal");
                   doc.setTextColor(60, 60, 60);
                   doc.text(descLines, 28, yPos + 4);
                }
                yPos += boxHeight + 3;
            } else {
                yPos += 3;
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`${i}/${pageCount}`, pageWidth - 15, pageHeight - 10);
            doc.text("LearnR Academy", pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
        doc.save(`${testData.title.replace(/\s+/g, '_')}_${type}.pdf`);
        toast.success("PDF Downloaded!");
        setDownloadModalOpen(false);
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate PDF");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleOpenPreview = async (test) => {
      let testData = test;
      if(!testData.questions || testData.questions.length === 0) {
        try {
            const res = await fetch(`/api/admin/tests/${test._id}`);
            if(res.ok) testData = await res.json();
        } catch(e) { console.error(e); }
      }
      setSelectedTestForPreview(testData);
      setPreviewModalOpen(true);
  };


  // --- RENDER CONDITION (UPDATED) ---
  if (selectedTestId) {
    return <MCQEditor testId={selectedTestId} onBack={() => setSelectedTestId(null)} />;
  }
  
  if (selectedAnalyticsTestId) {
    return <TestAnalyticsDashboard testId={selectedAnalyticsTestId} onBack={() => setSelectedAnalyticsTestId(null)} />;
  }

  // 3. New Condition for LIVE Page
  if (selectedLiveTestId) {
    return <LiveExamMonitor 
              testId={selectedLiveTestId} 
              onBack={() => { setSelectedLiveTestId(null); fetchTests(); }} 
           />;
  }

  // --- MAIN CARD LIST ---
  const filteredTests = tests.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* ... (Header aur Back button code same rahega) ... */}
      <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} className="mr-2"/> Back to Selection
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
        <div>
           <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">MCQ Manager</h1>
           <p className="text-gray-500 text-sm">Manage quizzes, entrance tests & practice sets</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
           <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-yellow-400 transition-colors" size={18} />
              <input type="text" placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all text-white"/>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-yellow-500 text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all active:scale-95 whitespace-nowrap">
             <Plus size={18} /> <span className="hidden md:inline">Create Quiz</span><span className="md:hidden">New</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
         {loading ? (
             <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500"/></div>
         ) : filteredTests.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500"><CheckSquare size={30}/></div>
                <p className="text-gray-400 font-medium">No exams found</p>
             </div>
         ) : (
             filteredTests.map((test) => (
                <div 
                  key={test._id}
                  className="group relative bg-[#0a0a0a] border border-white/5 hover:border-yellow-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)] cursor-pointer"
                >
                   {/* STATUS BADGES */}
                   <div className="absolute top-4 right-4 z-10">
                      {test.status === 'live' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black tracking-wider animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE
                          </span>
                      ) : test.status === 'completed' ? (
                          <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold border border-white/10">ENDED</span>
                      ) : test.status === 'draft' ? (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20">BUILDING</span>
                      ) : (
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">UPCOMING</span>
                      )}
                   </div>
                   
                   {/* 4. UPDATED CLICK HANDLER LOGIC */}
                   <div onClick={() => {
                        if (test.status === 'live') {
                            setSelectedLiveTestId(test._id); // <--- OPEN LIVE MONITOR
                        } else if (test.status === 'completed') {
                            setSelectedAnalyticsTestId(test._id); // OPEN ANALYTICS
                        } else {
                            setSelectedTestId(test._id); // OPEN EDITOR (Draft/Scheduled)
                        }
                   }}>
                        <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1 pr-20">{test.title}</h3>
                        <div className="space-y-2 mb-6 text-gray-400 text-xs">
                                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(test.scheduledAt).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2"><Clock size={14} /> {new Date(test.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {test.duration} Mins</div>
                        </div>
                   </div>

                   {/* Actions Footer */}
                   <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                      <div className="text-xs font-mono text-gray-500">{test.questions?.length || 0} Qs • {test.totalMarks} Marks</div>
                      
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setSelectedTestForDownload(test); setDownloadModalOpen(true); }} className="p-2 bg-yellow-500/5 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-lg transition-all shadow-[0_0_10px_rgba(234,179,8,0.05)] hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                            <Download size={18} strokeWidth={2.5}/>
                         </button>

                         {test.status === 'completed' && (
                             <button onClick={(e) => { e.stopPropagation(); setSelectedAnalyticsTestId(test._id); }} className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-all" title="View Result Analysis">
                                <BarChart2 size={18} />
                             </button>
                         )}

                         {(test.status === 'scheduled' || test.status === 'draft') && (
                             <button onClick={(e) => { e.stopPropagation(); handleOpenPreview(test); }} className="p-2 bg-white/5 hover:bg-green-500 text-gray-400 hover:text-black rounded-lg transition-all" title="Live Preview">
                                <PlayCircle size={18} />
                             </button>
                         )}
                         
                         {/* Live Stop Button in Card (optional now since page has it too) */}
                         {test.status === 'live' && (
                             <button onClick={(e) => { e.stopPropagation(); toggleStatus(test._id, 'completed'); }} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><StopCircle size={18} /></button>
                         )}

                         <button onClick={(e) => { e.stopPropagation(); setSelectedTestId(test._id); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit size={16} /></button>
                      </div>
                   </div>
                </div>
             ))
         )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                 <h2 className="text-lg font-bold text-white">Create New Quiz</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                 <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" placeholder="Exam Title"/>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                    <input type="time" required value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Duration (min)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                    <input type="number" placeholder="Total Marks" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg cursor-pointer" onClick={() => setFormData({...formData, isManualStart: !formData.isManualStart})}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isManualStart ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`}>
                        {formData.isManualStart && <CheckSquare size={14} className="text-black"/>}
                    </div>
                    <div><p className="text-sm font-bold text-yellow-100">Manual Start Mode</p></div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Create & Start Editing"}</button>
              </form>
           </div>
        </div>
      )}

      {/* DOWNLOAD MODAL */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0a0a0a] w-full max-w-md rounded-3xl border border-yellow-500/30 shadow-[0_0_60px_-15px_rgba(234,179,8,0.3)] overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]"></div>
                <div className="p-8 text-center relative z-10">
                    <button onClick={() => setDownloadModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                    <div className="w-20 h-20 bg-yellow-500/5 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">
                        <Download size={36} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Download Paper</h2>
                    <p className="text-gray-400 text-sm mb-8">Select format for <span className="text-yellow-400 font-bold">{selectedTestForDownload?.title}</span></p>
                    <div className="space-y-4">
                        <button onClick={() => generatePDF('question_paper')} disabled={isDownloading} className="w-full group/btn relative flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[#121212] hover:border-yellow-500 hover:bg-yellow-950/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-xl bg-gray-900 group-hover/btn:bg-yellow-500 group-hover/btn:text-black text-gray-400 flex items-center justify-center transition-all duration-300 border border-white/5"><FileText size={20} strokeWidth={2.5}/></div>
                            <div className="text-left flex-1"><p className="text-white font-bold text-lg group-hover/btn:text-yellow-400 transition-colors">Question Paper</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">Questions Only</p></div>
                            {isDownloading && <Loader2 className="animate-spin text-yellow-500"/>}
                        </button>
                        <button onClick={() => generatePDF('solution')} disabled={isDownloading} className="w-full group/btn relative flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[#121212] hover:border-green-500 hover:bg-green-950/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-xl bg-gray-900 group-hover/btn:bg-green-500 group-hover/btn:text-black text-gray-400 flex items-center justify-center transition-all duration-300 border border-white/5"><CheckCircle size={20} strokeWidth={2.5}/></div>
                            <div className="text-left flex-1"><p className="text-white font-bold text-lg group-hover/btn:text-green-400 transition-colors">Solution Key</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">With Answers & Logic</p></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewModalOpen && selectedTestForPreview && (
          <div className="fixed inset-0 z-[250] bg-black/95 flex flex-col animate-in fade-in duration-300 items-center justify-center p-4">
             <div className="w-full h-full max-w-7xl bg-[#050505] flex flex-col rounded-3xl overflow-hidden shadow-[0_0_80px_-20px_rgba(234,179,8,0.2)] border border-yellow-500/20 relative">
                {/* Header with Admin Controls */}
                <div className="bg-[#0a0a0a] border-b border-white/10 p-5 flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-4 md:gap-0">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.8)]"></div>
                    
                    <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse">
                           <MonitorPlay size={20} strokeWidth={2.5}/>
                        </div>
                        <div>
                           <h2 className="text-white font-black text-2xl leading-none tracking-tight">{selectedTestForPreview.title}</h2>
                           <div className="flex items-center gap-2 mt-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${selectedTestForPreview.status === 'live' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                              <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                                  {selectedTestForPreview.status === 'live' ? 'EXAM LIVE' : 'PREVIEW MODE'}
                              </p>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                         <button onClick={() => handleDelete(selectedTestForPreview._id)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-xs rounded-lg transition-all border border-red-500/20">
                            <Trash2 size={16}/> <span className="hidden md:inline">CANCEL EXAM</span>
                         </button>
                         <button onClick={() => toggleStatus(selectedTestForPreview._id, 'completed')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-white text-gray-400 hover:text-black font-bold text-xs rounded-lg transition-all border border-white/10">
                            <Power size={16}/> <span className="hidden md:inline">END EXAM</span>
                         </button>
                         {selectedTestForPreview.status !== 'live' && (
                            <button onClick={() => toggleStatus(selectedTestForPreview._id, 'live')} className="group flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-lg transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] active:scale-95">
                                <PlayCircle size={18} className="group-hover:scale-110 transition-transform"/> LAUNCH
                            </button>
                         )}
                         <button onClick={() => setPreviewModalOpen(false)} className="ml-2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5"><X size={18} /></button>
                    </div>
                </div>

                {/* Content (Paper) */}
                <div className="flex-1 bg-[#050505] p-6 md:p-10 overflow-y-auto relative scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-8 pb-10">
                            {selectedTestForPreview.questions?.map((q, idx) => (
                                <div key={idx} className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-yellow-500/30 transition-all duration-500 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.1)]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4">
                                            <span className="text-yellow-500 font-black text-xl md:text-2xl mt-0.5 shadow-black drop-shadow-lg">Q{idx + 1}.</span>
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-100 leading-relaxed font-sans">{q.questionText}</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pl-0 md:pl-10">
                                        {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className="group/opt relative flex items-center gap-5 p-4 rounded-xl border border-white/5 bg-[#121212] hover:bg-[#181818] hover:border-yellow-500/40 cursor-pointer transition-all duration-300">
                                                <div className="w-8 h-8 rounded-full border-2 border-gray-700 group-hover/opt:border-yellow-500 flex items-center justify-center transition-colors shadow-inner bg-black/50">
                                                    <span className="text-xs font-bold text-gray-500 group-hover/opt:text-yellow-500">{String.fromCharCode(65+optIdx)}</span>
                                                </div>
                                                <span className="text-gray-300 font-medium text-lg group-hover/opt:text-white transition-colors">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-10 flex justify-center">
                                <button className="group relative px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] transition-all transform hover:-translate-y-1 active:scale-95">
                                    <span className="relative z-10 flex items-center gap-3">SUBMIT EXAM <CheckCircle size={24} strokeWidth={3}/></span>
                                </button>
                            </div>
                        </div>
                    </div>
             </div>
          </div>
      )}

    </div>
  );
}