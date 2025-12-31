"use client";
import { useState, useEffect } from "react";
import { 
  Book, File, CheckSquare, PlayCircle, Clock, 
  TrendingUp, Award, Zap, Bell, Calendar, Loader2 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Existing Imports
import StudentLectureViewer from "./StudentLectureViewer";
import StudentMaterialsViewer from "./StudentMaterialsViewer";
import StudentTestViewer from "./StudentTestViewer";
import StudentNoticeBoard from "./StudentNoticeBoard";
import StudentSyllabusViewer from "./StudentSyllabusViewer";
import StudentLiveViewer from "./StudentLiveViewer";
import StudentFeeManagement from "./StudentFeeManagement"; 

// --- 1. STUDENT OVERVIEW TAB ---
const StudentOverviewTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
        setLoading(false); 
        return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/student-analytics`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const json = await res.json();
        if (json.success) {
            setData(json.data);
        } else {
            setError(json.error || "Failed to load data");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) return (
    <div className="flex h-96 items-center justify-center text-cyan-400">
       <Loader2 className="animate-spin w-10 h-10" />
       <span className="ml-3 font-mono tracking-widest text-xs md:text-base">LOADING...</span>
    </div>
  );

  if (error) return (
    <div className="flex h-96 items-center justify-center text-red-400 flex-col p-4 text-center">
       <p className="font-bold text-lg mb-2">Failed to load Dashboard</p>
       <p className="text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>
    </div>
  );

  const { stats, graphData, upcomingTests, recentNotices, liveStatus, studentName } = data || {};

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-8">
       
       {/* 1. WELCOME BANNER & LIVE STATUS */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2 md:mb-4">
          <div>
             <h1 className="text-2xl md:text-4xl font-black text-white">
                Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">{studentName?.split(" ")[0] || "Student"}</span>
             </h1>
             <p className="text-gray-400 text-xs md:text-base mt-1 md:mt-2">Welcome to your classroom.</p>
          </div>
          
          {liveStatus?.isLive ? (
             <div className="w-full md:w-auto bg-red-500/10 border border-red-500/50 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-between md:justify-start gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-red-500"></span>
                    </span>
                    <div>
                    <p className="text-red-500 font-bold text-xs md:text-sm tracking-widest">LIVE NOW</p>
                    <p className="text-white text-[10px] md:text-xs truncate max-w-[150px] md:max-w-none">{liveStatus.topic || "Session"}</p>
                    </div>
                </div>
                <button className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold hover:bg-red-700">JOIN</button>
             </div>
          ) : (
             <div className="hidden md:flex bg-gray-900/50 border border-gray-800 px-6 py-3 rounded-2xl items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                <p className="text-gray-500 font-bold text-sm tracking-widest">NO LIVE CLASS</p>
             </div>
          )}
       </div>

       {/* 2. STATS GRID (Mobile Scrollable) */}
       <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory no-scrollbar">
          {/* Card 1 */}
          <div className="min-w-[85%] md:min-w-0 snap-center bg-[#0a0a0a] border border-cyan-500/20 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 md:-mr-16 md:-mt-16"></div>
             <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-cyan-500/10 rounded-lg md:rounded-xl text-cyan-400">
                   <TrendingUp size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Performance</p>
             </div>
             <h3 className="text-3xl md:text-4xl font-black text-white">{stats?.avgPercentage?.toFixed(0) || 0}%</h3>
             <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">Average score</p>
          </div>

          {/* Card 2 */}
          <div className="min-w-[85%] md:min-w-0 snap-center bg-[#0a0a0a] border border-purple-500/20 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 md:-mr-16 md:-mt-16"></div>
             <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg md:rounded-xl text-purple-400">
                   <Award size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Completed</p>
             </div>
             <h3 className="text-3xl md:text-4xl font-black text-white">{stats?.testsTaken || 0}</h3>
             <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">Tests submitted</p>
          </div>

          {/* Card 3 */}
          <div className="min-w-[85%] md:min-w-0 snap-center bg-[#0a0a0a] border border-yellow-500/20 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 md:-mr-16 md:-mt-16"></div>
             <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-yellow-500/10 rounded-lg md:rounded-xl text-yellow-400">
                   <Clock size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Pending</p>
             </div>
             <h3 className="text-3xl md:text-4xl font-black text-white">{stats?.pendingTests || 0}</h3>
             <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">Tasks remaining</p>
          </div>
       </div>

       {/* 3. MAIN CONTENT: GRAPH & SIDEBAR */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Performance Graph */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[2rem] flex flex-col relative overflow-hidden shadow-2xl">
             <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                   <Zap className="text-cyan-400" size={18} /> Progress Chart
                </h3>
             </div>
             
             <div className="h-[200px] md:h-[300px] w-full -ml-2 md:ml-0">
                {graphData && graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="name" stroke="#555" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" tick={{fill: '#666', fontSize: 10}} domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#22d3ee' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#22d3ee" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-gray-800 rounded-2xl text-xs md:text-sm">
                     <p>Attempt tests to see graph!</p>
                  </div>
                )}
             </div>
          </div>

          {/* Sidebar (Upcoming & Notices) */}
          <div className="flex flex-col gap-4 md:gap-6">
             <div className="bg-[#0a0a0a] border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-[2rem] flex-1">
                <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                   <Calendar className="text-yellow-400" size={18} /> Upcoming
                </h3>
                <div className="space-y-2 md:space-y-3">
                   {upcomingTests?.length > 0 ? (
                      upcomingTests.map(test => (
                         <div key={test._id} className="p-3 bg-white/5 rounded-xl border border-transparent active:scale-95 transition-all">
                            <p className="text-white font-bold text-xs md:text-sm truncate">{test.title}</p>
                            <p className="text-gray-500 text-[10px] md:text-xs mt-0.5">
                               {new Date(test.scheduledAt).toLocaleDateString()} • {test.duration} mins
                            </p>
                         </div>
                      ))
                   ) : (
                      <p className="text-gray-600 text-xs md:text-sm italic">No upcoming tests.</p>
                   )}
                </div>
             </div>

             <div className="bg-[#0a0a0a] border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-[2rem] flex-1">
                <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                   <Bell className="text-blue-400" size={18} /> Notices
                </h3>
                <div className="space-y-2 md:space-y-3">
                   {recentNotices?.length > 0 ? (
                      recentNotices.map(notice => (
                         <div key={notice._id} className="p-3 bg-white/5 rounded-xl border border-transparent active:scale-95 transition-all">
                            <p className="text-white font-bold text-xs md:text-sm truncate">{notice.title}</p>
                            <p className="text-gray-500 text-[10px] md:text-xs mt-0.5 line-clamp-2">{notice.message}</p>
                         </div>
                      ))
                   ) : (
                      <p className="text-gray-600 text-xs md:text-sm italic">No new notices.</p>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default function StudentClassroomContent({ activeTab, courseId, courseData }) {
  const finalCourseId = courseId || courseData?._id;

  switch (activeTab) {
    case "overview": return <StudentOverviewTab courseId={finalCourseId} />;
    case "lectures": return <StudentLectureViewer courseId={finalCourseId} />;
    case "materials": return <StudentMaterialsViewer courseId={finalCourseId} />;
    case "tests": return <StudentTestViewer courseId={finalCourseId} />;
    case "notices": return <StudentNoticeBoard courseId={finalCourseId} />;
    case "syllabus": return <StudentSyllabusViewer courseId={finalCourseId} />;
    case "live": return <StudentLiveViewer courseId={finalCourseId} />;
    case "fees": return <StudentFeeManagement courseId={finalCourseId} />;
    default: return <div className="p-10 text-center text-gray-500">Content loading...</div>;
  }
}