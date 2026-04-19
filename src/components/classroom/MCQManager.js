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

import MCQEditor from "./MCQEditor";
import TestAnalyticsDashboard from "./TestAnalyticsDashboard"; 
import LiveExamMonitor from "./LiveExamMonitor";

const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({ dataURL: canvas.toDataURL('image/jpeg'), width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = url;
    });
};

export default function MCQManager({ courseId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false); 
  
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedAnalyticsTestId, setSelectedAnalyticsTestId] = useState(null); 
  const [selectedLiveTestId, setSelectedLiveTestId] = useState(null); 
  
  const [selectedTestForDownload, setSelectedTestForDownload] = useState(null); 
  const [selectedTestForPreview, setSelectedTestForPreview] = useState(null); 
  const [isDownloading, setIsDownloading] = useState(false);

  const [formData, setFormData] = useState({
    title: "", description: "", scheduledDate: "", scheduledTime: "", duration: 60, validityHours: 24, totalMarks: 100, isManualStart: false,
  });

  const fetchTests = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/tests?type=mcq`);
      if (res.ok) {
          const data = await res.json();
          setTests(data);
      }
    } catch (error) {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(courseId && !selectedTestId && !selectedAnalyticsTestId && !selectedLiveTestId) fetchTests(); 
  }, [courseId, selectedTestId, selectedAnalyticsTestId, selectedLiveTestId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 🛠️ TIMEZONE BUG FIX: Phone ke local time ko ISO format me badalna
      const localDateTimeString = `${formData.scheduledDate}T${formData.scheduledTime}`;
      const localDateObject = new Date(localDateTimeString);
      const isoScheduledAt = localDateObject.toISOString(); // Ye pure UTC form dega

      const res = await fetch(`/api/admin/courses/${courseId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ...formData, 
            scheduledAt: isoScheduledAt, // Corrected Time
            type: "mcq", 
            status: "draft" 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create test");
      
      toast.success("Exam Draft Created!");
      setIsModalOpen(false);
      setSelectedTestId(data._id);
      setFormData({ title: "", description: "", scheduledDate: "", scheduledTime: "", duration: 60, validityHours: 24, totalMarks: 100, isManualStart: false });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const generatePDF = async (type) => {
    if (!selectedTestForDownload) return;
    setIsDownloading(true);
    const loadingToast = toast.loading("Compiling Paper with Images...");

    try {
        let testData = selectedTestForDownload;
        if(!testData.questions || testData.questions.length === 0) {
             const res = await fetch(`/api/admin/tests/${testData._id}`);
             if(res.ok) testData = await res.json();
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        doc.setFillColor(255, 204, 0); 
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(0, 0, 0); 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14); 
        doc.text("LearnR Academy", 12, 13);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Exam Paper", pageWidth - 30, 13);

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

        let yPos = 50;
        
        for (let index = 0; index < testData.questions?.length; index++) {
            const q = testData.questions[index];
            
            if (yPos > pageHeight - 30) {
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

            if (q.imageUrl) {
                try {
                    const imgObj = await getBase64Image(q.imageUrl);
                    const maxW = pageWidth - 40; 
                    const maxH = 60; 
                    const ratio = Math.min(maxW / imgObj.width, maxH / imgObj.height);
                    const w = imgObj.width * ratio;
                    const h = imgObj.height * ratio;

                    if (yPos + h > pageHeight - 20) {
                        doc.addPage();
                        yPos = 15;
                    }
                    
                    doc.addImage(imgObj.dataURL, 'JPEG', 16, yPos, w, h);
                    yPos += h + 4; 
                } catch (err) {
                    console.error("Failed to load PDF image", err);
                }
            }

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
        }

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`${i}/${pageCount}`, pageWidth - 15, pageHeight - 10);
            doc.text("LearnR Academy", pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
        
        doc.save(`${testData.title.replace(/\s+/g, '_')}_${type}.pdf`);
        toast.dismiss(loadingToast);
        toast.success("PDF Downloaded with Images!");
        setDownloadModalOpen(false);
    } catch (error) {
        toast.dismiss(loadingToast);
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
        } catch(e) { }
      }
      setSelectedTestForPreview(testData);
      setPreviewModalOpen(true);
  };

  if (selectedTestId) {
    return <MCQEditor testId={selectedTestId} onBack={() => setSelectedTestId(null)} />;
  }
  
  if (selectedAnalyticsTestId) {
    return <TestAnalyticsDashboard testId={selectedAnalyticsTestId} onBack={() => setSelectedAnalyticsTestId(null)} />;
  }

  if (selectedLiveTestId) {
    return <LiveExamMonitor 
              testId={selectedLiveTestId} 
              onBack={() => { setSelectedLiveTestId(null); fetchTests(); }} 
           />;
  }

  const filteredTests = tests.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} className="mr-2"/> Back to Selection
      </button>

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
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-yellow-500 text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-yellow-400 transition-all active:scale-95 whitespace-nowrap">
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
                  className="group relative bg-[#0a0a0a] border border-white/5 hover:border-yellow-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                   <div className="absolute top-4 right-4 z-10">
                      {test.status === 'live' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black tracking-wider animate-pulse">
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
                   
                   <div onClick={() => {
                        if (test.status === 'live') setSelectedLiveTestId(test._id); 
                        else if (test.status === 'completed') setSelectedAnalyticsTestId(test._id); 
                        else setSelectedTestId(test._id); 
                   }}>
                        <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1 pr-20">{test.title}</h3>
                        <div className="space-y-2 mb-6 text-gray-400 text-xs">
                                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(test.scheduledAt).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2"><Clock size={14} /> {new Date(test.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {test.duration} Mins</div>
                        </div>
                   </div>

                   <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                      <div className="text-xs font-mono text-gray-500">{test.questions?.length || 0} Qs • {test.totalMarks} Marks</div>
                      
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setSelectedTestForDownload(test); setDownloadModalOpen(true); }} className="p-2 hover:bg-yellow-500 hover:text-black text-yellow-500 rounded-lg transition-all">
                            <Download size={18}/>
                         </button>
                         {test.status === 'completed' && (
                             <button onClick={(e) => { e.stopPropagation(); setSelectedAnalyticsTestId(test._id); }} className="p-2 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-all"><BarChart2 size={18} /></button>
                         )}
                         {(test.status === 'scheduled' || test.status === 'draft') && (
                             <button onClick={(e) => { e.stopPropagation(); handleOpenPreview(test); }} className="p-2 hover:bg-green-500 text-gray-400 hover:text-black rounded-lg transition-all"><PlayCircle size={18} /></button>
                         )}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                 <h2 className="text-lg font-bold text-white">Create New Quiz</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-5">
                 <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Exam Title</label>
                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" placeholder="Enter exam title..."/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Scheduled Date</label>
                        <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500"/>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Scheduled Time</label>
                        <input type="time" required value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500"/>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Duration (Mins)</label>
                        <input type="number" min="1" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500"/>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block text-yellow-500">Valid For (Hrs)</label>
                        <input type="number" min="1" required value={formData.validityHours} onChange={e => setFormData({...formData, validityHours: e.target.value})} className="w-full bg-black border border-yellow-500/50 rounded-lg p-3 text-white outline-none focus:border-yellow-500" placeholder="e.g. 24"/>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Total Marks</label>
                        <input type="number" min="1" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500"/>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg cursor-pointer hover:bg-yellow-900/20 transition-colors" onClick={() => setFormData({...formData, isManualStart: !formData.isManualStart})}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isManualStart ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500 bg-black'}`}>
                        {formData.isManualStart && <CheckSquare size={14} className="text-black"/>}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-yellow-100">Manual Start Mode</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Start the exam manually regardless of scheduled time.</p>
                    </div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition-colors active:scale-[0.98]">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Create & Start Editing"}
                 </button>
              </form>
           </div>
        </div>
      )}
      {/*... Modal code waisa hi rahega ...*/}
    </div>
  );
}