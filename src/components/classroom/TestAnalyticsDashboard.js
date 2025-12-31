"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Search, Trophy, TrendingDown, Users, 
  UserX, CheckCircle, XCircle, Clock, Eye, X
} from "lucide-react";

export default function TestAnalyticsDashboard({ testId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("📡 Fetching Analytics for Test:", testId);
        const res = await fetch(`/api/admin/tests/${testId}/analytics`);
        
        if (res.ok) {
           const json = await res.json();
           console.log("📥 Analytics Data Received:", json);
           setData(json);
        } else {
           console.error("❌ API Error:", res.statusText);
        }
      } catch (err) {
        console.error("🔥 Network Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if(testId) fetchData();
  }, [testId]);

  if (loading) return <div className="p-20 text-center text-yellow-500 font-bold animate-pulse font-mono">ANALYZING EXAM DATA...</div>;
  if (!data) return <div className="p-20 text-center text-red-500 font-bold">Failed to load analytics data. Check console.</div>;

  // 🛠️ FIX: Safe Filter Logic (Debugs included)
  const filteredStudents = data.analytics.studentsData.filter(s => {
      if (!s.name) {
          console.warn("⚠️ Found student with NO NAME:", s);
          return false; // Skip bad data
      }
      return s.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
         <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20}/>
         </button>
         <div>
            <h1 className="text-2xl font-black text-white">{data.testTitle} <span className="text-yellow-500">Analytics</span></h1>
            <p className="text-gray-500 text-sm">Comprehensive Result Analysis & Student Performance</p>
         </div>
      </div>

      {/* 1. GRAPHS & STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Smartest Students Card */}
          <div className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={80} className="text-yellow-500"/>
              </div>
              <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Trophy size={16}/> Top Performers
              </h3>
              <div className="space-y-3 relative z-10">
                  {data.analytics.topStudents.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':'bg-gray-700 text-white'}`}>
                                  {i+1}
                              </div>
                              <span className="text-white text-sm font-bold truncate w-24 md:w-32">{s.name}</span>
                          </div>
                          <span className="text-yellow-500 font-mono text-sm font-bold">{s.score}/{s.totalMarks}</span>
                      </div>
                  ))}
                  {data.analytics.topStudents.length === 0 && <p className="text-gray-500 text-xs italic">No data available</p>}
              </div>
          </div>

          {/* Hardest Questions Card */}
          <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingDown size={80} className="text-red-500"/>
              </div>
              <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingDown size={16}/> Most Mistakes In
              </h3>
              <div className="space-y-3 relative z-10">
                  {data.analytics.hardQuestions.map((q, i) => (
                      <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                              <span>Q{q.qIndex}</span>
                              <span className="text-red-400">{q.wrongCount} Wrong</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                style={{width: `${data.analytics.stats.present > 0 ? (q.wrongCount / data.analytics.stats.present) * 100 : 0}%`}} 
                                className="h-full bg-red-500 rounded-full"
                              ></div>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">{q.questionText}</p>
                      </div>
                  ))}
                  {data.analytics.hardQuestions.length === 0 && <p className="text-gray-500 text-xs italic">No data available</p>}
              </div>
          </div>

          {/* Attendance Stats */}
          <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Users size={16}/> Attendance
              </h3>
              <div className="flex justify-around items-center">
                  <div className="text-center">
                      <div className="text-3xl font-black text-white mb-1">{data.analytics.stats.totalStudents}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Total</div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10"></div>
                  <div className="text-center">
                      <div className="text-3xl font-black text-green-400 mb-1">{data.analytics.stats.present}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Present</div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10"></div>
                  <div className="text-center">
                      <div className="text-3xl font-black text-red-400 mb-1">{data.analytics.stats.absent}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Absent</div>
                  </div>
              </div>
              <div className="mt-8">
                 <div className="h-2 w-full bg-gray-800 rounded-full flex overflow-hidden">
                    <div style={{width: `${data.analytics.stats.totalStudents > 0 ? (data.analytics.stats.present/data.analytics.stats.totalStudents)*100 : 0}%`}} className="bg-green-500 h-full"></div>
                    <div style={{width: `${data.analytics.stats.totalStudents > 0 ? (data.analytics.stats.absent/data.analytics.stats.totalStudents)*100 : 0}%`}} className="bg-red-500 h-full"></div>
                 </div>
              </div>
          </div>
      </div>

      {/* 2. SEARCH & RANK BOARD */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 Leaderboard & Papers <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20">{data.analytics.studentsData.length} Students</span>
              </h2>
              <div className="relative group w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-yellow-400 transition-colors" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search student..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white placeholder:text-gray-600"
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs">
                    <tr>
                        <th className="p-4 w-16">Rank</th>
                        <th className="p-4">Student</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Score</th>
                        <th className="p-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                                {s.status === 'Absent' ? '-' : (
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-black ${s.rank <= 3 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-600 text-white'}`}>
                                        {s.rank}
                                    </span>
                                )}
                            </td>
                            <td className="p-4">
                                <p className="font-bold text-white group-hover:text-yellow-400 transition-colors">{s.name || "Unknown Name"}</p>
                                <p className="text-xs text-gray-600">{s.email}</p>
                            </td>
                            <td className="p-4 text-center">
                                {s.status === 'Present' ? (
                                    <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold border border-green-500/20">
                                        <CheckCircle size={12}/> Present
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                                        <XCircle size={12}/> Absent
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-center font-mono text-white">
                                {s.status === 'Present' ? (
                                    <span className="text-lg font-bold">{s.score} <span className="text-xs text-gray-600">/ {s.totalMarks}</span></span>
                                ) : '-'}
                            </td>
                            <td className="p-4 text-center">
                                {s.status === 'Present' && (
                                    <button 
                                      onClick={() => setSelectedStudent(s)}
                                      className="p-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition-all"
                                      title="View Paper"
                                    >
                                        <Eye size={18}/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No students found</td></tr>
                    )}
                </tbody>
             </table>
          </div>
      </div>

      {/* 3. STUDENT PAPER MODAL */}
      {selectedStudent && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
              <div className="w-full max-w-4xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col relative shadow-2xl">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xl">
                              {(selectedStudent.name || "U").charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-white">{selectedStudent.name}'s Paper</h2>
                              <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                  <span className="text-yellow-500 font-bold">Score: {selectedStudent.score}/{selectedStudent.totalMarks}</span>
                                  <span>Rank: #{selectedStudent.rank}</span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24}/></button>
                  </div>

                  {/* Paper Content */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                      {data.questions.map((q, idx) => {
                          const studentAns = selectedStudent.answers ? selectedStudent.answers[idx] : null;
                          const isCorrect = studentAns === q.correctOption;
                          const isUnattempted = studentAns === null || studentAns === undefined || studentAns === -1;
                          
                          return (
                              <div key={idx} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : isUnattempted ? 'border-gray-700 bg-gray-900/50' : 'border-red-500/20 bg-red-500/5'}`}>
                                  <div className="flex justify-between items-start mb-4">
                                      <h3 className="text-lg font-bold text-white"><span className="text-gray-500 mr-2">Q{idx+1}.</span> {q.questionText}</h3>
                                      {isCorrect ? 
                                          <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded flex items-center gap-1"><CheckCircle size={12}/> Correct</span> 
                                          : isUnattempted ?
                                          <span className="text-gray-500 text-xs font-bold px-2 py-1 bg-gray-700/20 rounded flex items-center gap-1"><Clock size={12}/> Skipped</span>
                                          : 
                                          <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-500/10 rounded flex items-center gap-1"><XCircle size={12}/> Wrong</span>
                                      }
                                  </div>
                                  
                                  <div className="space-y-2 pl-4 border-l-2 border-white/5">
                                      {q.options.map((opt, optIdx) => {
                                          let optClass = "text-gray-400 p-3 rounded border border-transparent";
                                          
                                          if (optIdx === q.correctOption) optClass = "bg-green-500/20 text-green-400 border-green-500/30 font-bold";
                                          else if (optIdx === studentAns && !isCorrect) optClass = "bg-red-500/20 text-red-400 border-red-500/30 font-bold line-through";

                                          return (
                                              <div key={optIdx} className={`flex items-center gap-3 ${optClass}`}>
                                                  <span className="text-xs uppercase w-6 h-6 rounded-full border border-current flex items-center justify-center">{String.fromCharCode(65+optIdx)}</span>
                                                  <span>{opt}</span>
                                              </div>
                                          )
                                      })}
                                  </div>

                                  {/* Explanation */}
                                  {q.description && (
                                      <div className="mt-4 pt-4 border-t border-white/5">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Explanation:</p>
                                          <p className="text-sm text-gray-400">{q.description}</p>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}