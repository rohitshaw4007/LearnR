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
                const isSkipped = q.selectedOption === null;
                
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

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-left: 5px;">
                        ${q.options.map((opt, oIdx) => {
                            let style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #eee; background: #f9f9f9;";
                            let label = "";

                            if (isReport) {
                                const isThisCorrect = (oIdx === q.correctOption);
                                const isThisSelected = (oIdx === q.selectedOption);

                                if (isThisCorrect) {
                                    style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #006400; background: #e6fffa; color: #006400; font-weight: bold;";
                                    label = (isThisSelected) ? "✅ (Your Answer)" : "✅ (Correct Answer)";
                                } 
                                else if (isThisSelected) {
                                    style = "padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid #8B0000; background: #fff5f5; color: #8B0000; text-decoration: line-through;";
                                    label = "❌ (Your Answer)";
                                }
                            }

                            return `<div style="${style}">
                                ${String.fromCharCode(65 + oIdx)}. ${opt} 
                                <span style="float: right; font-size: 9px; font-weight: bold;">${label}</span>
                            </div>`;
                        }).join('')}
                    </div>

                    ${isReport && q.description ? `
                        <div style="margin-top: 10px; background: #fffbe6; padding: 8px 12px; border-left: 4px solid #FFD700; font-size: 9px; color: #444; border-radius: 0 4px 4px 0;">
                            <strong style="color: #d4a000; text-transform: uppercase;">💡 Explanation:</strong><br/>
                            ${q.description}
                        </div>
                    ` : ''}

                </div>`;
            }).join('')}
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
            Generated by LearnR Portal • Official Exam Report
        </div>
      </div>
    `;

    const opt = { margin: 10, filename: isReport ? `Full_Report.pdf` : `Question_Paper.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await window.html2pdf().set(opt).from(element).save(); toast.success(isReport ? "Report Downloaded!" : "Paper Downloaded!"); } catch (err) { toast.error("Download Failed"); } finally { setDownloading(false); }
  };

  const handleSidebarTabChange = (newTab) => { router.push(`/dashboard/classroom/${params.id}?tab=${newTab}`); };

  // --- RENDERING ---
  
  if (loading) return <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={40}/></div>;
  
  if (errorMsg || !resultData) return (
      <div className="fixed inset-0 bg-[#050505] z-[100] flex items-center justify-center flex-col text-white p-6 text-center">
          <AlertCircle size={50} className="text-red-500 mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Failed to load Result</h2>
          <p className="text-gray-500 mb-6 font-mono bg-white/5 p-2 rounded text-xs">{errorMsg || "No Data Received"}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-white/10 rounded-full hover:bg-white/20">Go Back</button>
      </div>
  );

  // Stats
  const questions = resultData?.questions || [];
  const correctCount = questions.filter(q => q.selectedOption !== null && q.selectedOption === q.correctOption).length;
  const wrongCount = questions.filter(q => q.selectedOption !== null && q.selectedOption !== q.correctOption).length;
  const skippedCount = questions.filter(q => q.selectedOption === null).length;
  const myRank = leaderboardData?.find(u => u.isCurrentUser)?.rank || "-";
  const filteredLeaderboard = leaderboardData?.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] overflow-hidden flex flex-col md:flex-row text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      <StudentClassroomSidebar activeTab="tests" setActiveTab={handleSidebarTabChange} courseTitle="Exam Result" />

      <div className="flex-1 relative h-full overflow-y-auto scroll-smooth md:ml-64 pt-14 pb-20 md:py-0 md:pb-0">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-md border-b border-white/10 flex items-center px-4 z-50 justify-between">
             <div className="flex items-center gap-3">
                 <button onClick={() => router.back()} className="p-1 text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
                 <span className="font-bold text-sm">Exam Analysis</span>
             </div>
        </div>

        <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-5xl mx-auto">
            
            {/* 1. Score Card (Mobile Optimized) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Big Box */}
                <div className="md:col-span-2 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-5 md:p-6 relative overflow-hidden flex flex-col justify-center shadow-lg">
                    {/* FIX: Removed md:size, used Tailwind classes instead */}
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <BarChart2 className="text-yellow-500 w-[120px] h-[120px] md:w-[150px] md:h-[150px]" />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-gray-400 text-[10px] md:text-sm font-mono uppercase tracking-wider mb-1 md:mb-2">My Score</p>
                        <div className="flex items-end gap-3 md:gap-4">
                            {/* Adjusted Size for Mobile */}
                            <h1 className="text-5xl md:text-7xl font-black text-white">{resultData.obtainedMarks}</h1>
                            <span className="text-lg md:text-2xl text-gray-500 font-bold mb-3 md:mb-4">/ {resultData.totalMarks}</span>
                        </div>
                        
                        <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-6 text-xs md:text-base">
                            {/* FIX: Replaced size/md:size with w/h classes */}
                            <div className="flex items-center gap-1.5 md:gap-2 text-green-400 bg-green-900/10 px-2.5 py-1.5 md:px-3 rounded-lg border border-green-500/20">
                                <CheckCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> 
                                <span className="font-bold">{correctCount} Correct</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-red-400 bg-red-900/10 px-2.5 py-1.5 md:px-3 rounded-lg border border-red-500/20">
                                <XCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> 
                                <span className="font-bold">{wrongCount} Wrong</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 bg-gray-800/20 px-2.5 py-1.5 md:px-3 rounded-lg border border-gray-600/20">
                                <AlertCircle className="w-[14px] h-[14px] md:w-4 md:h-4" /> 
                                <span className="font-bold">{skippedCount} Skipped</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rank Small Box (Mobile Optimized) */}
                <div className="bg-yellow-500 rounded-2xl p-5 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center text-black relative overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <div className="absolute inset-0 bg-white/20 blur-xl"></div>
                    
                    {/* Icon & Label */}
                    <div className="relative z-10 flex items-center md:flex-col gap-3 md:gap-0">
                        {/* FIX: Replaced size/md:size with w/h classes */}
                        <Trophy className="text-black opacity-80 md:mb-2 w-9 h-9 md:w-12 md:h-12"/>
                        <p className="font-black text-[10px] md:text-sm uppercase tracking-widest opacity-70">Global Rank</p>
                    </div>

                    {/* Rank Value */}
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-6xl font-black">#{myRank}</h2>
                    </div>
                </div>
            </div>

            {/* 2. Downloads (Mobile Optimized Buttons) */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 md:p-6 relative overflow-hidden">
                 <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500"></div>
                 <div className="mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        {/* FIX: Replaced size/md:size with w/h classes */}
                        <FileText className="text-yellow-500 w-[18px] h-[18px] md:w-5 md:h-5"/> 
                        Exam Resources
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Download paper or full report.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button 
                        onClick={() => generatePDF('questions')} 
                        disabled={downloading} 
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-sm"
                    >
                        {downloading ? <Loader2 className="animate-spin" size={16}/> : <BookOpen size={16} className="text-gray-400"/>} 
                        Question Paper
                    </button>
                    <button 
                        onClick={() => generatePDF('report')} 
                        disabled={downloading} 
                        className="flex-1 px-4 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                        {downloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} 
                        Download Full Report
                    </button>
                 </div>
            </div>

            {/* 3. Leaderboard (Mobile Optimized Table) */}
            {leaderboardData && (
            <div className="space-y-4 pt-4">
                <div className="flex flex-col md:flex-row justify-between items-end gap-3 md:gap-4">
                    <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">Rank List</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2 text-gray-500" size={14}/>
                        <input 
                            type="text" 
                            placeholder="Find student..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full bg-[#111] border border-white/10 rounded-full py-1.5 md:py-2 pl-9 pr-4 text-xs text-white focus:border-yellow-500 outline-none"
                        />
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-500 text-[10px] md:text-xs font-mono uppercase tracking-widest">
                                    <th className="p-3 md:p-4">Rank</th>
                                    <th className="p-3 md:p-4">Student</th>
                                    <th className="p-3 md:p-4 text-center">Score</th>
                                    <th className="p-3 md:p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[10px] md:text-sm">
                                {filteredLeaderboard.map((user, idx) => (
                                    <tr key={idx} className={`transition-colors hover:bg-white/[0.02] ${user.isCurrentUser ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : ''}`}>
                                        <td className="p-3 md:p-4 font-mono font-bold text-gray-400">
                                            {user.rank === 1 ? <span className="text-yellow-400 text-xs md:text-base">#1 👑</span> : 
                                             user.rank === 2 ? <span className="text-gray-300 text-xs md:text-base">#2 🥈</span> : 
                                             user.rank === 3 ? <span className="text-orange-400 text-xs md:text-base">#3 🥉</span> : 
                                             `#${user.rank}`}
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {user.name} 
                                                {user.isCurrentUser && <span className="text-[8px] md:text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">YOU</span>}
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-4 text-center font-mono text-yellow-500 font-bold text-xs md:text-sm">
                                            {user.status === "Absent" ? "-" : user.score}
                                        </td>
                                        <td className="p-3 md:p-4 text-right">
                                            {user.status === "Present" 
                                                ? <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-500/20"><CheckCircle size={10}/> Attempted</span> 
                                                : <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/20"><UserX size={10}/> Absent</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}