"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Calendar, Clock, CheckSquare, 
  PlayCircle, StopCircle, Edit, Loader2, X, ArrowLeft, 
  Download, FileText, CheckCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf"; 

import ClassroomSidebar from "@/components/classroom/ClassroomNavbar"; 

export default function MCQManagerPage({ params }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState(null);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedTestForDownload, setSelectedTestForDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "", description: "", scheduledDate: "",
    scheduledTime: "", duration: 60, totalMarks: 100, isManualStart: false,
  });

  // 1. FETCH DATA (Fixed Cache)
  const fetchData = async () => {
    console.log("🔄 [MCQ PAGE] Fetching Course & Tests...");
    try {
      const t = new Date().getTime();
      
      const courseRes = await fetch(`/api/admin/courses/${courseId}?t=${t}`, { cache: 'no-store' });
      if (courseRes.ok) {
         const courseData = await courseRes.json();
         setCourse(courseData);
      }

      const testsRes = await fetch(`/api/admin/courses/${courseId}/tests?type=mcq&t=${t}`, { cache: 'no-store' });
      if (testsRes.ok) {
          const testsData = await testsRes.json();
          console.log(`✅ [MCQ PAGE] Loaded ${testsData.length} tests`);
          setTests(testsData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(courseId) fetchData();
  }, [courseId]);

  // 2. CREATE TEST
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
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Exam Draft Created!");
      setIsModalOpen(false);
      fetchData(); // Refresh list
      setFormData({
        title: "", description: "", scheduledDate: "",
        scheduledTime: "", duration: 60, totalMarks: 100, isManualStart: false
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. START/STOP TEST
  const toggleStatus = async (testId, newStatus) => {
    console.log(`⚡ [ACTION] Changing status of ${testId} to ${newStatus}`);
    try {
        const res = await fetch(`/api/admin/tests/${testId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) {
            toast.success(`Exam status updated to ${newStatus}`);
            fetchData(); // Immediate Refresh
        } else {
            console.error("Status update failed", await res.json());
        }
    } catch (err) {
        toast.error("Action failed");
    }
  };

  // ... (PDF Generation Code remains same - No changes needed there) ...
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
        
        doc.setFillColor(6, 182, 212);
        doc.rect(0, 0, pageWidth, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("LearnR Academy", 14, 16);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Official Exam Paper", pageWidth - 40, 16);

        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "bold");
        doc.setFontSize(22);
        doc.text(testData.title || "Untitled Exam", 14, 40);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const dateStr = new Date(testData.scheduledAt).toLocaleDateString();
        doc.text(`Date: ${dateStr}  |  Duration: ${testData.duration} Mins  |  Max Marks: ${testData.totalMarks}`, 14, 48);

        doc.setDrawColor(6, 182, 212);
        doc.setLineWidth(0.8);
        doc.line(14, 54, pageWidth - 14, 54);

        let yPos = 65;
        testData.questions.forEach((q, index) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
                doc.setFillColor(6, 182, 212); 
                doc.rect(0, 0, pageWidth, 5, 'F');
            }
            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            const questionTitle = `Q.${index + 1}  ${q.questionText}`;
            const splitTitle = doc.splitTextToSize(questionTitle, pageWidth - 30);
            doc.text(splitTitle, 14, yPos);
            yPos += (splitTitle.length * 6) + 4;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            q.options.forEach((opt, optIndex) => {
                const optLabel = String.fromCharCode(65 + optIndex);
                doc.text(`(${optLabel}) ${opt}`, 20, yPos);
                yPos += 6;
            });

            if (type === 'solution') {
                yPos += 2;
                const descHeight = q.description ? 15 : 8;
                doc.setFillColor(240, 253, 250); 
                doc.rect(14, yPos - 4, pageWidth - 28, descHeight, 'F');
                doc.setTextColor(6, 182, 212); 
                doc.setFont("helvetica", "bold");
                const correctLabel = String.fromCharCode(65 + q.correctOption);
                doc.text(`Correct Ans: (${correctLabel})`, 18, yPos + 2);
                if (q.description) {
                   yPos += 6;
                   doc.setFont("helvetica", "italic");
                   doc.setTextColor(80, 80, 80);
                   const cleanDesc = q.description.replace(/<[^>]*>?/gm, ''); 
                   doc.text(`Exp: ${cleanDesc}`, 18, yPos + 2);
                }
                yPos += 10;
            } else {
                yPos += 8; 
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount} - LearnR Academy`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
        doc.save(`${testData.title.replace(/\s+/g, '_')}_${type}.pdf`);
        toast.success("PDF Downloaded Successfully!");
        setDownloadModalOpen(false);
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate PDF");
    } finally {
        setIsDownloading(false);
    }
  };

  const filteredTests = tests.filter(t => 
    t.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center text-white">
         <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] overflow-hidden flex flex-col md:flex-row">
       <ClassroomSidebar activeTab="tests" setActiveTab={(tab) => tab !== 'tests' && router.push(`/admin/classroom/${courseId}`)} courseTitle={course?.title || "Loading..."} />
       <div className="flex-1 relative h-full overflow-y-auto scroll-smooth md:ml-64 pt-14 pb-20 md:py-0 bg-[#050505]">
          <div className="min-h-full p-4 md:p-8">
            <button onClick={() => router.push(`/admin/classroom/${courseId}`)} className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
               <ArrowLeft size={16} className="mr-2"/> Back to Dashboard
            </button>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">MCQ Manager</h1>
                    <p className="text-gray-500 text-sm">Create, manage and distribute exam papers</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-cyan-400 transition-colors" size={18} />
                        <input type="text" placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-white transition-all"/>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-cyan-500 text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-cyan-400 transition-all whitespace-nowrap">
                        <Plus size={18} /> <span className="hidden md:inline">Create Quiz</span><span className="md:hidden">New</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredTests.map((test) => (
                    <div key={test._id} className="group relative bg-[#0a0a0a] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-4 right-4 z-10">
                            {test.status === 'live' ? <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black tracking-wider animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE</span> : 
                            test.status === 'completed' ? <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold border border-white/10">ENDED</span> : 
                            test.status === 'draft' ? <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20">BUILDING</span> : 
                            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">UPCOMING</span>}
                        </div>
                        <div className="cursor-pointer" onClick={() => router.push(`/admin/classroom/${courseId}/tests/mcq/${test._id}`)}>
                            <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1 pr-20">{test.title}</h3>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-gray-400 text-xs"><Calendar size={14} />{new Date(test.scheduledAt).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs"><Clock size={14} />{new Date(test.scheduledAt).toLocaleTimeString()} <span className="text-gray-600">•</span> {test.duration} Mins</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                            <div className="text-xs font-mono text-gray-500">{test.questions?.length || 0} Qs • {test.totalMarks} Marks</div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedTestForDownload(test); setDownloadModalOpen(true); }} className="p-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-500 hover:text-black rounded-lg transition-all"><Download size={18} /></button>
                                {(test.status === 'scheduled' || test.status === 'draft') && <button onClick={(e) => { e.stopPropagation(); toggleStatus(test._id, 'live'); }} className="p-2 hover:bg-green-500/20 rounded-lg text-green-500"><PlayCircle size={18} /></button>}
                                {test.status === 'live' && <button onClick={(e) => { e.stopPropagation(); toggleStatus(test._id, 'completed'); }} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"><StopCircle size={18} /></button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
       </div>
       {/* Modals omitted for brevity since they are same as before but ensure they use the logic from above */}
       {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                 <h2 className="text-lg font-bold text-white">Create New Quiz</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                 <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" placeholder="Exam Title" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                    <input type="time" required value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Duration (min)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                    <input type="number" placeholder="Total Marks" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: e.target.value})} className="bg-black border border-white/10 rounded-lg p-3 text-white outline-none"/>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-lg cursor-pointer" onClick={() => setFormData({...formData, isManualStart: !formData.isManualStart})}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isManualStart ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'}`}>{formData.isManualStart && <CheckSquare size={14} className="text-black"/>}</div>
                    <div><p className="text-sm font-bold text-cyan-100">Manual Start Mode</p></div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Create Quiz"}</button>
              </form>
           </div>
        </div>
      )}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0a0a0a] w-full max-w-md rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)] overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_20px_rgba(6,182,212,0.6)]"></div>
                <div className="p-8 text-center relative z-10">
                    <button onClick={() => setDownloadModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                    <div className="w-20 h-20 bg-cyan-500/5 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-400 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse"><Download size={36} /></div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Download Paper</h2>
                    <p className="text-gray-400 text-sm mb-8">Select format for <span className="text-cyan-400 font-bold">{selectedTestForDownload?.title}</span></p>
                    <div className="space-y-4">
                        <button onClick={() => generatePDF('question_paper')} disabled={isDownloading} className="w-full group/btn relative flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[#121212] hover:border-cyan-500 hover:bg-cyan-950/20 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-gray-900 group-hover/btn:bg-cyan-500 group-hover/btn:text-black text-gray-400 flex items-center justify-center transition-all duration-300 border border-white/5"><FileText size={20} strokeWidth={2.5}/></div>
                            <div className="text-left flex-1"><p className="text-white font-bold text-lg group-hover/btn:text-cyan-400 transition-colors">Question Paper</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">Questions Only</p></div>
                        </button>
                        <button onClick={() => generatePDF('solution')} disabled={isDownloading} className="w-full group/btn relative flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[#121212] hover:border-green-500 hover:bg-green-950/20 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-gray-900 group-hover/btn:bg-green-500 group-hover/btn:text-black text-gray-400 flex items-center justify-center transition-all duration-300 border border-white/5"><CheckCircle size={20} strokeWidth={2.5}/></div>
                            <div className="text-left flex-1"><p className="text-white font-bold text-lg group-hover/btn:text-green-400 transition-colors">Solution Key</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">With Answers & Logic</p></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}