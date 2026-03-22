"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, StopCircle, RefreshCcw, User, 
  Clock, CheckCircle, XCircle, Loader2, Search, Timer, 
  TrendingUp, FileText, X 
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function LiveExamMonitor({ testId, onBack }) {
  const [testDetails, setTestDetails] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endingExam, setEndingExam] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [timeLeft, setTimeLeft] = useState("");
  const [timeProgress, setTimeProgress] = useState(0);
  const [isTimeCritical, setIsTimeCritical] = useState(false);

  // NEW: State for modal
  const [viewPaperStudent, setViewPaperStudent] = useState(null);

  const fetchLiveData = async () => {
    try {
      const t = new Date().getTime();

      const testRes = await fetch(`/api/admin/tests/${testId}?t=${t}`, { cache: 'no-store' });
      if (!testRes.ok) throw new Error("Failed to fetch test details");
      const testData = await testRes.json();
      setTestDetails(testData);

      const analyticsRes = await fetch(`/api/admin/tests/${testId}/analytics?t=${t}`, { cache: 'no-store' });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        
        // Ensure timeTaken and answers are captured
        const submissions = analyticsData.analytics?.studentsData?.filter(s => s.status === 'Present').map(s => ({
            studentName: s.name,
            email: s.email,
            submittedAt: s.submittedAt,
            score: s.score,
            timeTaken: s.timeTaken, // NEW
            answers: s.answers      // NEW
        })) || [];

        setAnalytics({
            ...analyticsData,
            submissions: submissions,
            highestScore: analyticsData.analytics?.topStudents?.[0]?.score || 0,
            averageScore: 0 
        });
      }

    } catch (error) {
      toast.error("Connection Error: Failed to update live data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!testId) return;
    fetchLiveData();
    const interval = setInterval(() => fetchLiveData(), 15000); 
    return () => clearInterval(interval);
  }, [testId]);

  useEffect(() => {
    if (!testDetails) return;
    const calculateTime = () => {
      const startTime = new Date(testDetails.scheduledAt).getTime();
      const validHours = testDetails.validityHours || 24;
      const windowDurationMs = validHours * 60 * 60 * 1000; 
      
      const endTime = startTime + windowDurationMs;
      const now = new Date().getTime();
      
      const difference = endTime - now;
      const elapsed = now - startTime;
      const progress = Math.min(100, Math.max(0, (elapsed / windowDurationMs) * 100));
      
      setTimeProgress(progress);

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        setIsTimeCritical(true);
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours > 0 ? hours + ':' : ''}${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
      setIsTimeCritical(difference < 30 * 60 * 1000);
    };

    calculateTime();
    const timerInterval = setInterval(calculateTime, 1000);
    return () => clearInterval(timerInterval);
  }, [testDetails]);

  const handleEndExam = async () => {
    if (!confirm("Are you sure you want to END this exam?")) return;
    setEndingExam(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      if (res.ok) {
        toast.success("Exam has been ended successfully!");
        onBack(); 
      }
    } catch (error) { toast.error("Error ending exam"); } 
    finally { setEndingExam(false); }
  };

  // NEW: Formatter
  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filteredStudents = analytics?.submissions?.filter(sub => 
    (sub.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (sub.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) || [];

  if (loading && !testDetails) {
    return (
        <div className="flex flex-col h-96 items-center justify-center gap-4">
            <Loader2 className="animate-spin text-cyan-500" size={50}/>
            <p className="text-cyan-500 font-mono animate-pulse">CONNECTING TO LIVE SERVER...</p>
        </div>
    );
  }

  const startTimeObj = testDetails ? new Date(testDetails.scheduledAt) : new Date();
  const validHoursRender = testDetails?.validityHours || 24;
  const windowEndTimeObj = new Date(startTimeObj.getTime() + (validHoursRender * 60 * 60 * 1000));

  return (
    <div className="animate-in fade-in slide-in-from-right duration-300 pb-20">
      
      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <button onClick={onBack} className="mb-4 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} className="mr-2"/> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-black text-white">{testDetails?.title}</h1>
             <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE NOW
             </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={fetchLiveData} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Force Refresh">
                <RefreshCcw size={20} />
            </button>
            <button 
                onClick={handleEndExam} disabled={endingExam}
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
                {endingExam ? <Loader2 className="animate-spin" size={20}/> : <StopCircle size={20} />}
                End Exam
            </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className={`md:col-span-4 relative overflow-hidden rounded-2xl border ${isTimeCritical ? 'border-red-500/30 bg-red-500/5' : 'border-cyan-500/30 bg-cyan-500/5'} p-6 flex flex-col justify-center items-center text-center shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                  <div className={`h-full transition-all duration-1000 ${isTimeCritical ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${timeProgress}%` }}></div>
              </div>
              <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${isTimeCritical ? 'text-red-400' : 'text-cyan-400'}`}>Window Closing In</p>
              <div className="flex items-center gap-3">
                 <Timer size={32} className={isTimeCritical ? 'text-red-500 animate-pulse' : 'text-cyan-500'} />
                 <h2 className={`text-5xl font-black font-mono tracking-tighter ${isTimeCritical ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                    {timeLeft}
                 </h2>
              </div>
              <p className="text-gray-500 text-xs mt-4">Ends at {windowEndTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>

          <div className="md:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                  <h3 className="text-gray-400 font-bold text-sm flex items-center gap-2 mb-4"><Clock size={16} className="text-yellow-500"/> Exam Schedule</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-gray-500 text-sm">Start Time</span>
                          <span className="text-white font-mono font-bold">{startTimeObj.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-gray-500 text-sm">Window Ends ({validHoursRender}h)</span>
                          <span className="text-red-400 font-mono font-bold">{windowEndTimeObj.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-sm">Duration</span>
                          <span className="text-yellow-400 font-bold">{testDetails?.duration} Minutes</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="md:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <h3 className="text-gray-400 font-bold text-sm flex items-center gap-2 mb-6"><TrendingUp size={16} className="text-green-500"/> Live Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111] rounded-xl p-4 text-center border border-white/5">
                      <p className="text-2xl font-black text-white">{analytics?.submissions?.length || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Submitted</p>
                  </div>
                  <div className="bg-[#111] rounded-xl p-4 text-center border border-white/5">
                      <p className="text-2xl font-black text-green-400">{analytics?.highestScore || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Top Score</p>
                  </div>
              </div>
          </div>
      </div>

      {/* STUDENT LIST */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <h3 className="text-xl font-bold text-white">Submitted Students</h3>
                 <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-bold border border-white/10">{analytics?.submissions?.length || 0}</span>
              </div>
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-cyan-500 outline-none"
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-[#111] text-gray-400 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Student Name</th>
                          <th className="p-4 font-medium">Submitted At</th>
                          <th className="p-4 font-medium">Time Taken</th>
                          <th className="p-4 font-medium">Score</th>
                          <th className="p-4 font-medium text-center">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {filteredStudents.length > 0 ? (
                          filteredStudents.map((student, index) => (
                              <tr key={index} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-lg bg-cyan-900/20 border border-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-sm">
                                              {student.studentName?.charAt(0) || "U"}
                                          </div>
                                          <div>
                                              <p className="text-white text-sm font-medium">{student.studentName || "Unknown"}</p>
                                              <p className="text-gray-500 text-xs">{student.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 text-gray-400 text-sm font-mono">
                                      {new Date(student.submittedAt).toLocaleTimeString()}
                                  </td>
                                  {/* NEW COLUMN */}
                                  <td className="p-4 text-gray-400 text-sm font-mono">
                                      <div className="flex items-center gap-1"><Clock size={14}/> {formatTime(student.timeTaken)}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-baseline gap-1">
                                         <span className="font-mono text-white font-bold text-lg">{student.score}</span> 
                                         <span className="text-gray-600 text-xs">/ {testDetails?.totalMarks}</span>
                                      </div>
                                  </td>
                                  {/* NEW ACTION BUTTON */}
                                  <td className="p-4 text-center">
                                      <button onClick={() => setViewPaperStudent(student)} className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded transition-colors text-xs font-bold inline-flex items-center gap-1 border border-yellow-500/20">
                                          <FileText size={14}/> Paper
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan="5" className="p-12 text-center text-gray-500">No submissions yet.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* VIEW PAPER MODAL FOR LIVE EXAM */}
      {viewPaperStudent && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex justify-center p-4 overflow-y-auto animate-in fade-in">
              <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-2xl my-auto flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center bg-[#111] sticky top-0 z-10 rounded-t-2xl">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                             <FileText size={20} className="text-yellow-500"/> {viewPaperStudent.studentName}'s Answer Sheet
                          </h2>
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-3">
                             <span>Score: <span className="text-yellow-500 font-bold">{viewPaperStudent.score} / {testDetails?.totalMarks}</span></span>
                             <span className="flex items-center gap-1"><Clock size={14}/> {formatTime(viewPaperStudent.timeTaken)}</span>
                          </p>
                      </div>
                      <button onClick={() => setViewPaperStudent(null)} className="p-2 bg-white/5 hover:bg-red-500 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-5 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-[#050505]">
                      {testDetails?.questions?.map((q, idx) => {
                          const studentAns = viewPaperStudent.answers[idx];
                          const isCorrect = studentAns === q.correctOption;
                          const isSkipped = studentAns === null || studentAns === undefined || studentAns === -1;
                          
                          return (
                              <div key={idx} className={`bg-[#0a0a0a] border rounded-2xl p-5 md:p-6 shadow-lg ${isCorrect ? 'border-green-500/30' : isSkipped ? 'border-gray-600/30' : 'border-red-500/30'}`}>
                                  <div className="flex justify-between items-start gap-4 mb-4">
                                      <h3 className="text-white font-bold leading-relaxed">
                                         <span className="text-yellow-500 mr-2 font-black text-lg">Q{idx+1}.</span>{q.questionText}
                                      </h3>
                                      <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest border flex-shrink-0 ${isCorrect ? 'bg-green-500/10 text-green-500 border-green-500/20' : isSkipped ? 'bg-gray-800 text-gray-400 border-white/10' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                          {isCorrect ? 'CORRECT' : isSkipped ? 'SKIPPED' : 'INCORRECT'}
                                      </span>
                                  </div>
                                  
                                  {q.imageUrl && (
                                      <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-black/40 p-2 inline-block">
                                         {/* eslint-disable-next-line @next/next/no-img-element */}
                                         <img src={q.imageUrl} alt="Graphic" className="max-w-full max-h-[200px] object-contain rounded-lg"/>
                                      </div>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {q.options.map((opt, oIdx) => {
                                          const isThisCorrect = oIdx === q.correctOption;
                                          const isThisSelected = oIdx === studentAns;
                                          
                                          let optStyle = "bg-[#111] border-white/5 text-gray-400";
                                          if (isThisCorrect) optStyle = "bg-green-500/10 border-green-500/50 text-green-400 font-bold";
                                          else if (isThisSelected && !isThisCorrect) optStyle = "bg-red-500/10 border-red-500/50 text-red-400 line-through opacity-70";

                                          return (
                                              <div key={oIdx} className={`p-3 md:p-4 rounded-xl border flex items-center gap-3 transition-colors ${optStyle}`}>
                                                  <span className="font-mono text-xs opacity-50">[{String.fromCharCode(65+oIdx)}]</span>
                                                  <span className="text-sm flex-1">{opt}</span>
                                                  {isThisCorrect && <CheckCircle size={16} className="text-green-500 flex-shrink-0"/>}
                                                  {isThisSelected && !isThisCorrect && <XCircle size={16} className="text-red-500 flex-shrink-0"/>}
                                              </div>
                                          )
                                      })}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}