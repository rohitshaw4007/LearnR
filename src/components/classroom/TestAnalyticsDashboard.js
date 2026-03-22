"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Users, CheckCircle, XCircle, Trophy, 
  Loader2, Search, Download, BarChart2, Filter,
  FileText, Clock, X // ADDED ICONS
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function TestAnalyticsDashboard({ testId, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All"); 
  
  // NEW: State for viewing student paper
  const [viewPaperStudent, setViewPaperStudent] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/admin/tests/${testId}/analytics?t=${Date.now()}`);
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          toast.error("Failed to load analytics");
        }
      } catch (error) {
        toast.error("Connection Error");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [testId]);

  // NEW: Time formatter
  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) return (
      <div className="flex flex-col h-96 items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={50}/>
          <p className="text-blue-500 font-mono tracking-widest animate-pulse text-sm">COMPILING ANALYTICS</p>
      </div>
  );

  const filteredStudents = analytics?.studentsData?.filter(student => {
     const matchesSearch = student.name?.toLowerCase().includes(search.toLowerCase()) || student.email?.toLowerCase().includes(search.toLowerCase());
     const matchesFilter = filter === "All" || student.status === filter;
     return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in fade-in slide-in-from-right duration-500 pb-20 relative">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} className="mr-2"/> Back to Exams
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-2xl md:text-4xl font-black text-white">{analytics?.testDetails?.title}</h1>
           <p className="text-gray-500 text-sm mt-1">Detailed Performance Analytics</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
         <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-gray-800 opacity-20 group-hover:scale-110 transition-transform"><Users size={80}/></div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Enrolled</p>
            <h3 className="text-4xl font-black text-white">{analytics?.totalStudents}</h3>
         </div>
         <div className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(34,197,94,0.05)]">
            <div className="absolute -right-6 -top-6 text-green-900 opacity-20 group-hover:scale-110 transition-transform"><CheckCircle size={80}/></div>
            <p className="text-green-500 text-xs font-bold uppercase tracking-wider mb-2">Present</p>
            <h3 className="text-4xl font-black text-green-400">{analytics?.presentCount}</h3>
         </div>
         <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(239,68,68,0.05)]">
            <div className="absolute -right-6 -top-6 text-red-900 opacity-20 group-hover:scale-110 transition-transform"><XCircle size={80}/></div>
            <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">Absent</p>
            <h3 className="text-4xl font-black text-red-400">{analytics?.absentCount}</h3>
         </div>
         <div className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(234,179,8,0.05)]">
            <div className="absolute -right-6 -top-6 text-yellow-900 opacity-20 group-hover:scale-110 transition-transform"><Trophy size={80}/></div>
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Score</p>
            <h3 className="text-4xl font-black text-yellow-400">{analytics?.averageScore}</h3>
         </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: STUDENT TABLE */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4 bg-[#111]">
                 <div className="flex items-center gap-3">
                     <h3 className="font-bold text-lg text-white">Student Results</h3>
                     <span className="px-2 py-0.5 rounded bg-gray-800 text-xs font-bold text-gray-400 border border-white/10">{filteredStudents?.length}</span>
                 </div>
                 
                 <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                        <input 
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name/email..." 
                            className="w-full bg-[#181818] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                        <select 
                            value={filter} onChange={e => setFilter(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Students</option>
                            <option value="Present">Present Only</option>
                            <option value="Absent">Absent Only</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#111] border-b border-white/5">
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Details</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time Taken</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredStudents?.map((student, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 border border-white/5 mr-3">
                                            {student.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{student.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {student.status === 'Present' 
                                        ? <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Present</span>
                                        : <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Absent</span>
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                                    {student.status === 'Present' ? (
                                        <span className="flex items-center gap-1"><Clock size={14} className="text-gray-500"/> {formatTime(student.timeTaken)}</span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {student.status === 'Present' ? (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-white font-mono">{student.score}</span>
                                            <span className="text-xs text-gray-600">/ {analytics.testDetails.totalMarks}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {student.status === 'Present' && (
                                        <button 
                                           onClick={() => setViewPaperStudent(student)} 
                                           className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2 border border-yellow-500/20"
                                        >
                                            <FileText size={14}/> View Paper
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredStudents?.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">No students match your search/filter.</td></tr>
                        )}
                    </tbody>
                 </table>
              </div>
          </div>

          {/* RIGHT: LEADERBOARD */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#0a0a0a] border border-yellow-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <Trophy className="text-yellow-500" size={24}/>
                      <h3 className="text-xl font-bold text-white">Top 5 Performers</h3>
                  </div>

                  <div className="space-y-3 relative z-10">
                      {analytics?.topStudents?.length > 0 ? analytics.topStudents.map((student, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-white/5 hover:border-yellow-500/30 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-gray-800 text-gray-400 border border-white/5'}`}>
                                      #{idx + 1}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{student.name}</p>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{formatTime(student.timeTaken)}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-lg font-black text-yellow-400 font-mono">{student.score}</p>
                              </div>
                          </div>
                      )) : (
                          <p className="text-center text-gray-500 text-sm py-4">No results available yet.</p>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* VIEW PAPER MODAL */}
      {viewPaperStudent && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex justify-center p-4 overflow-y-auto animate-in fade-in">
              <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-2xl my-auto flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  {/* Header */}
                  <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center bg-[#111] sticky top-0 z-10 rounded-t-2xl">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                             <FileText size={20} className="text-yellow-500"/> {viewPaperStudent.name}'s Answer Sheet
                          </h2>
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-3">
                             <span>Score: <span className="text-yellow-500 font-bold">{viewPaperStudent.score} / {analytics?.testDetails?.totalMarks}</span></span>
                             <span className="flex items-center gap-1"><Clock size={14}/> {formatTime(viewPaperStudent.timeTaken)}</span>
                          </p>
                      </div>
                      <button onClick={() => setViewPaperStudent(null)} className="p-2 bg-white/5 hover:bg-red-500 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                  </div>
                  
                  {/* Paper Content */}
                  <div className="p-5 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-[#050505]">
                      {analytics?.testDetails?.questions?.map((q, idx) => {
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