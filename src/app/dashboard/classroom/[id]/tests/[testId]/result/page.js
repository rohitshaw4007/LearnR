"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Search, Download, FileText, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, BarChart2, BookOpen, UserX } from "lucide-react";
import toast from "react-hot-toast";
import StudentClassroomSidebar from "@/components/classroom/StudentClassroomSidebar";

export default function ResultPage() {
  const params = useParams(); // { id: courseId, testId: testId }
  const router = useRouter();
  
  const [resultData, setResultData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAllData = async () => {
      if (!params.testId || !params.id) {
          setErrorMsg("Invalid URL: Missing Test ID or Course ID");
          setLoading(false);
          return;
      }

      try {
        setLoading(true);

        // 1. Fetch Result
        const resultRes = await fetch(`/api/exam/${params.testId}/result`);
        let resultJson;
        try {
            resultJson = await resultRes.json();
        } catch (e) {
            throw new Error(`Invalid Server Response (${resultRes.status})`);
        }

        if (!resultRes.ok) {
            console.error("❌ Result API Failed:", resultJson);
            throw new Error(resultJson.message || `Server Error: ${resultRes.status}`);
        }
        
        if (resultJson.success) {
            setResultData(resultJson.data);
        } else {
            throw new Error(resultJson.message || "Unknown API Error");
        }

        // 2. Fetch Leaderboard
        try {
            const lbRes = await fetch(`/api/courses/${params.id}/tests/${params.testId}/leaderboard`);
            if(lbRes.ok) {
                const lbJson = await lbRes.json();
                if (lbJson.success) setLeaderboardData(lbJson.leaderboard);
            }
        } catch (err) {
            console.warn("Leaderboard failed to load:", err);
        }

      } catch (error) {
        console.error("🔥 Critical Error:", error.message);
        setErrorMsg(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [params.id, params.testId]);

  // --- PDF GENERATION ---
  const generatePDF = async (mode) => {
    if (!resultData?.questions) return toast.error("Data not available");
    setDownloading(true);

    if (typeof window !== "undefined" && !window.html2pdf) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = resolve;
            document.body.appendChild(script);
        });
    }

    const isReport = mode === 'report';
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 20px; font-size: 10px; line-height: 1.4;">
        
        <div style="background-color: #FFD700; color: #000; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center; border: 2px solid #000;">
            <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 900;">${isReport ? 'DETAILED PERFORMANCE REPORT' : 'QUESTION PAPER'}</h1>
            <p style="margin: 5px 0 0; font-size: 11px;">
               ${isReport ? `<strong>Score:</strong> ${resultData.obtainedMarks}/${resultData.totalMarks}` : 'Practice Set'}
            </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${resultData.questions.map((q, idx) => {
                const isCorrect = q.selectedOption === q.correctOption;
                const isSkipped = q.selectedOption === null || q.selectedOption === -1;
                
                const statusColor = isReport 
                    ? (isCorrect ? '#006400' : isSkipped ? '#666' : '#8B0000') 
                    : '#000';
                
                const statusText = isReport
                    ? (isCorrect ? 'CORRECT' : isSkipped ? 'SKIPPED' : 'INCORRECT')
                    : `Q${idx + 1}`;

                return `
                <div style="border-bottom: 1px dashed #ccc; padding-bottom: 10px; page-break-inside: avoid;">
                    
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 6px;">
                        <span style="background: ${statusColor}; color: #fff; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-size: 9px; vertical-align: middle;">
                           ${isReport ? `Q${idx+1} • ${statusText}` : `Q${idx+1}`}
                        </span>
                        <span style="vertical-align: middle;">${q.questionText}</span>
                    </div>

                    ${q.imageUrl ? `
                    <div style="margin-top: 8px; margin-bottom: 8px;">
                        <img src="${q.imageUrl}" style="max-height: 150px; max-width: 100%; border: 1px solid #ccc; border-radius: 4px;" />
                    </div>
                    ` : ''}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-left: 5px;">
                        ${q.options.map((opt, oIdx) => {
                            let style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #eee; background: #f9f9f9;";
                            let label = "";

                            if (isReport) {
                                const isThisCorrect = (oIdx === q.correctOption);
                                const isThisSelected = (oIdx === q.selectedOption);

                                if (isThisCorrect) {
                                    style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #006400; background: #e6f2e6; color: #006400; font-weight: bold;";
                                    label = "✓ Correct";
                                } else if (isThisSelected && !isThisCorrect) {
                                    style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #8B0000; background: #fee6e6; color: #8B0000; text-decoration: line-through;";
                                    label = "✗ Your Answer";
                                }
                            }

                            return `
                            <div style="${style}">
                                ${String.fromCharCode(65 + oIdx)}. ${opt} 
                                ${label ? `<span style="float: right; font-size: 8px;">${label}</span>` : ''}
                            </div>
                            `;
                        }).join('')}
                    </div>

                    ${isReport && q.description ? `
                    <div style="margin-top: 8px; padding: 6px; background: #fffde7; border-left: 3px solid #FFD700; font-size: 9px; color: #444;">
                        <strong>Explanation:</strong> ${q.description}
                    </div>
                    ` : ''}
                    
                </div>
                `;
            }).join('')}
        </div>
      </div>
    `;

    const opt = {
      margin:       0.3,
      filename:     `${resultData.testTitle}_${isReport ? 'Report' : 'Paper'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Added useCORS: true for images
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        await window.html2pdf().set(opt).from(element).save();
        toast.success("PDF Downloaded!");
    } catch (e) {
        toast.error("Download failed");
    } finally {
        setDownloading(false);
    }
  };

  // --- RENDERING ---
  if (loading) return <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={40}/></div>;
  
  if (errorMsg || !resultData) return (
      <div className="fixed inset-0 bg-[#050505] z-[100] flex items-center justify-center flex-col text-white p-6 text-center">
          <AlertCircle size={50} className="text-red-500 mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Failed to load Result</h2>
          <p className="text-gray-500 mb-6 font-mono bg-white/5 p-2 rounded text-xs">{errorMsg || "Unknown Error"}</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition">Return Back</button>
      </div>
  );

  const filteredQuestions = resultData.questions?.filter(q => 
    q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const correctCount = resultData.correctCount || 0;
  const wrongCount = resultData.wrongCount || 0;
  const skippedCount = resultData.questions.length - (correctCount + wrongCount);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <StudentClassroomSidebar courseId={params.id} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 animate-in fade-in duration-300 pb-20">
          
          {/* HEADER */}
          <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 p-4 md:p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <button onClick={() => router.push(`/dashboard/classroom/${params.id}`)} className="flex items-center text-gray-500 hover:text-yellow-500 transition-colors text-xs font-bold mb-2 uppercase tracking-widest">
                   <ArrowLeft size={14} className="mr-1"/> Classroom
                </button>
                <h1 className="text-xl md:text-3xl font-black text-white">{resultData.testTitle}</h1>
                <p className="text-xs text-gray-500 font-mono mt-1">Submitted on {new Date(resultData.submittedAt).toLocaleString()}</p>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                 <button onClick={() => generatePDF('paper')} disabled={downloading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-gray-300 transition-colors">
                     <FileText size={16}/> Paper
                 </button>
                 <button onClick={() => generatePDF('report')} disabled={downloading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-black transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                     {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} Full Report
                 </button>
             </div>
          </div>

          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              
              {/* LEFT COLUMN: QUESTIONS */}
              <div className="xl:col-span-2 space-y-6">
                  
                  {/* Search Bar */}
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                      <input 
                         type="text"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Search questions..."
                         className="w-full bg-[#111] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                      />
                  </div>

                  {/* Questions List */}
                  <div className="space-y-6">
                      {filteredQuestions.map((q, index) => {
                          const isCorrect = q.selectedOption === q.correctOption;
                          const isSkipped = q.selectedOption === null || q.selectedOption === -1;
                          
                          return (
                              <div key={index} className={`bg-[#0a0a0a] border rounded-2xl p-5 md:p-8 transition-colors ${isCorrect ? 'border-green-500/30' : isSkipped ? 'border-gray-600/30' : 'border-red-500/30'}`}>
                                  
                                  {/* Q Header */}
                                  <div className="flex justify-between items-start gap-4 mb-4 md:mb-6">
                                      <h3 className="text-base md:text-xl font-bold text-white leading-relaxed">
                                          <span className="text-yellow-500 mr-2 font-black">Q{index + 1}.</span>
                                          {q.questionText}
                                      </h3>
                                      <span className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-black tracking-widest border flex-shrink-0 ${isCorrect ? 'bg-green-500/10 text-green-500 border-green-500/20' : isSkipped ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                          {isCorrect ? 'CORRECT' : isSkipped ? 'SKIPPED' : 'INCORRECT'}
                                      </span>
                                  </div>

                                  {/* NEW: RESULT PAGE IMAGE DISPLAY */}
                                  {q.imageUrl && (
                                      <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-black/40 p-2 inline-block">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={q.imageUrl} alt="Question Graphic" className="max-w-full max-h-[250px] object-contain rounded-lg" />
                                      </div>
                                  )}

                                  {/* Options */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                                      {q.options.map((opt, optIdx) => {
                                          const isThisCorrect = optIdx === q.correctOption;
                                          const isThisSelected = optIdx === q.selectedOption;
                                          
                                          let optStyle = "bg-[#111] border-white/5 text-gray-400"; // Default
                                          if (isThisCorrect) optStyle = "bg-green-500/10 border-green-500/50 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                          else if (isThisSelected && !isThisCorrect) optStyle = "bg-red-500/10 border-red-500/50 text-red-400 line-through opacity-80";

                                          return (
                                              <div key={optIdx} className={`relative p-3 md:p-4 rounded-xl border flex items-start gap-3 transition-colors ${optStyle}`}>
                                                  <span className="font-mono text-xs mt-0.5 opacity-50">[{String.fromCharCode(65+optIdx)}]</span>
                                                  <span className="text-sm md:text-base">{opt}</span>
                                                  
                                                  {isThisCorrect && <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"/>}
                                                  {isThisSelected && !isThisCorrect && <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"/>}
                                              </div>
                                          )
                                      })}
                                  </div>

                                  {/* Explanation */}
                                  {q.description && (
                                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mt-2 relative overflow-hidden">
                                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                                          <h4 className="text-xs font-bold text-yellow-500 mb-1 flex items-center gap-2"><BookOpen size={14}/> EXPLANATION</h4>
                                          <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{q.description}</p>
                                      </div>
                                  )}

                              </div>
                          )
                      })}
                  </div>
              </div>

              {/* RIGHT COLUMN: STATS & LEADERBOARD */}
              <div className="space-y-6">
                  
                  {/* Score Card */}
                  <div className="bg-gradient-to-br from-yellow-600/20 to-[#111] border border-yellow-500/30 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-[0_0_40px_-10px_rgba(234,179,8,0.2)]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <Trophy size={48} className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Final Score</p>
                      <div className="flex items-baseline justify-center gap-1 mb-6">
                          <span className="text-6xl font-black text-white">{resultData.obtainedMarks}</span>
                          <span className="text-xl text-gray-500 font-bold">/ {resultData.totalMarks}</span>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm">
                          <div className="flex items-center gap-1.5 md:gap-2 text-green-400 bg-green-900/20 px-2.5 py-1.5 md:px-3 rounded-lg border border-green-500/20">
                              <CheckCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> <span className="font-bold">{correctCount} Correct</span>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 text-red-400 bg-red-900/20 px-2.5 py-1.5 md:px-3 rounded-lg border border-red-500/20">
                              <XCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> <span className="font-bold">{wrongCount} Wrong</span>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 bg-gray-800/20 px-2.5 py-1.5 md:px-3 rounded-lg border border-gray-600/20">
                              <AlertCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> <span className="font-bold">{skippedCount} Skipped</span>
                          </div>
                      </div>
                  </div>

                  {/* Leaderboard Card */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden sticky top-[100px]">
                      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#111]">
                          <h3 className="font-bold text-white flex items-center gap-2"><BarChart2 size={18} className="text-yellow-500"/> Leaderboard</h3>
                          <span className="text-xs text-gray-500 font-mono">Top Rankers</span>
                      </div>
                      
                      <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {leaderboardData ? (
                              leaderboardData.length > 0 ? (
                                  leaderboardData.map((student, idx) => (
                                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${student.studentId === resultData.studentId ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : 'hover:bg-white/5'}`}>
                                          <div className="flex items-center gap-3">
                                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-[#222] text-gray-400'}`}>
                                                  {idx + 1}
                                              </span>
                                              <div className="flex flex-col">
                                                  <span className={`text-sm font-bold truncate max-w-[120px] ${student.studentId === resultData.studentId ? 'text-yellow-400' : 'text-gray-200'}`}>
                                                      {student.studentId === resultData.studentId ? "You (You)" : student.studentName}
                                                  </span>
                                                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">{student.timeTaken}s</span>
                                              </div>
                                          </div>
                                          <span className="font-mono font-bold text-sm bg-black/50 px-2 py-1 rounded border border-white/5">
                                              {student.score}
                                          </span>
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-8 text-center text-gray-500 text-sm">No rankings yet.</div>
                              )
                          ) : (
                              <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-600"/></div>
                          )}
                      </div>
                  </div>

              </div>

          </div>
      </div>
    </div>
  );
}