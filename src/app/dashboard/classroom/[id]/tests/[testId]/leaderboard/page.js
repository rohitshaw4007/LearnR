"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Search, Loader2, ArrowLeft, Clock } from "lucide-react";
import StudentClassroomSidebar from "@/components/classroom/StudentClassroomSidebar";

export default function FullLeaderboardPage() {
  const params = useParams();
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserResult, setCurrentUserResult] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const resResult = await fetch(`/api/exam/${params.testId}/result?t=${Date.now()}`);
        if (resResult.ok) {
            const resData = await resResult.json();
            if(resData.success) setCurrentUserResult(resData.data);
        }

        const res = await fetch(`/api/courses/${params.id}/tests/${params.testId}/leaderboard?t=${Date.now()}`);
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [params.id, params.testId]);

  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filteredLeaderboard = leaderboard.filter(student =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="fixed inset-0 bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <StudentClassroomSidebar courseId={params.id} />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 animate-in fade-in duration-300 pb-20">
          
          {/* HEADER */}
          <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 p-4 md:p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-yellow-500 transition-colors text-xs font-bold mb-2 uppercase tracking-widest">
                   <ArrowLeft size={14} className="mr-1"/> Back to Result
                </button>
                <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-3">
                    <Trophy className="text-yellow-500" size={28}/> 
                    Global Leaderboard
                </h1>
             </div>
             
             <div className="relative w-full md:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                 <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student name..."
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                 />
             </div>
          </div>

          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-[#111] text-gray-400 text-xs uppercase tracking-wider border-b border-white/5">
                                  <th className="p-5 font-bold text-center w-20">Rank</th>
                                  <th className="p-5 font-bold">Student Info</th>
                                  <th className="p-5 font-bold">Time Taken</th>
                                  <th className="p-5 font-bold text-right pr-8">Score</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {filteredLeaderboard.length > 0 ? (
                                  filteredLeaderboard.map((student, idx) => {
                                      // Real Rank maintaining actual position even in search
                                      const actualRank = leaderboard.findIndex(s => s.studentId === student.studentId) + 1;
                                      const isMe = currentUserResult?.studentId === student.studentId;

                                      return (
                                          <tr key={idx} className={`transition-colors ${isMe ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : 'hover:bg-white/5'}`}>
                                              <td className="p-5">
                                                  <div className="flex justify-center">
                                                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${actualRank === 1 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : actualRank === 2 ? 'bg-gray-300 text-black' : actualRank === 3 ? 'bg-orange-400 text-black' : 'bg-[#222] text-gray-400'}`}>
                                                          {actualRank}
                                                      </span>
                                                  </div>
                                              </td>
                                              <td className="p-5">
                                                  <div className="flex flex-col">
                                                      <span className={`text-base font-bold ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                                                          {isMe ? "You (Your Result)" : student.studentName}
                                                      </span>
                                                  </div>
                                              </td>
                                              <td className="p-5 text-gray-400 font-mono text-sm">
                                                  <div className="flex items-center gap-2">
                                                      <Clock size={14} className="text-gray-500"/>
                                                      {formatTime(student.timeTaken)}
                                                  </div>
                                              </td>
                                              <td className="p-5 text-right pr-8">
                                                  <span className="text-xl font-black text-white font-mono bg-[#111] px-4 py-1.5 rounded-lg border border-white/5">
                                                      {student.score}
                                                  </span>
                                              </td>
                                          </tr>
                                      );
                                  })
                              ) : (
                                  <tr><td colSpan="4" className="p-12 text-center text-gray-500 font-medium">No students found in the rankings.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}