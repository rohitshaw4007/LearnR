"use client";
import { useState, useEffect } from "react";
import { 
  Book, File, CheckSquare, ChevronRight, FileEdit, 
  TrendingUp, Users, DollarSign, Activity, PlayCircle, Award, Loader2 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Existing Imports
import NoticeBoard from "./NoticeBoard"; 
import SyllabusManager from "./SyllabusManager";
import LectureManager from "./LectureManager";
import MaterialsManager from "./MaterialsManager";
import LiveClassManager from "./LiveClassManager";
import MCQManager from "./MCQManager"; 
import SubjectiveManager from "./SubjectiveManager"; 
import FeeManagement from "./FeeManagement"; 

// --- 1. CUSTOM TOOLTIP COMPONENT (New & Beautiful) ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-yellow-500/30 p-4 rounded-2xl shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">{label}</p>
        <div className="flex items-center gap-2">
           <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
           <div>
              <p className="text-3xl font-black text-white">
                ₹{payload[0].value.toLocaleString()}
              </p>
              <p className="text-yellow-400 text-[10px] font-bold flex items-center gap-1">
                <TrendingUp size={10} /> REVENUE GENERATED
              </p>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- 2. OVERVIEW TAB (Updated Graph Section) ---
const OverviewTab = ({ courseId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}/analytics`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchStats();
  }, [courseId]);

  if (loading) return (
    <div className="flex h-96 items-center justify-center text-yellow-400">
      <Loader2 className="animate-spin w-10 h-10" />
      <span className="ml-3 font-mono tracking-widest">LOADING LIVE DATA...</span>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* --- TOP STATS GRID (Same as before) --- */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Revenue */}
          <div className="bg-[#0a0a0a] border border-yellow-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-yellow-500/60 transition-all shadow-[0_0_30px_-10px_rgba(234,179,8,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                   <DollarSign size={24} />
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
             </div>
             <h3 className="text-4xl font-black text-white mt-2">₹{stats?.revenue?.toLocaleString()}</h3>
             <p className="text-xs text-green-400 mt-2 font-mono flex items-center gap-1">
                <TrendingUp size={12} /> LIFETIME EARNINGS
             </p>
          </div>

          {/* Students */}
          <div className="bg-[#0a0a0a] border border-cyan-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-cyan-500/60 transition-all shadow-[0_0_30px_-10px_rgba(6,182,212,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
                   <Users size={24} />
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Students</p>
             </div>
             <h3 className="text-4xl font-black text-white mt-2">{stats?.students}</h3>
             <p className="text-xs text-gray-500 mt-2 font-mono">ACTIVE ENROLLMENTS</p>
          </div>

          {/* Content */}
          <div className="bg-[#0a0a0a] border border-purple-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/60 transition-all shadow-[0_0_30px_-10px_rgba(168,85,247,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                   <PlayCircle size={24} />
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Course Content</p>
             </div>
             <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-white">{stats?.lectures}</h3>
                <span className="text-xs text-gray-500 font-bold">LECS</span>
                <span className="text-gray-700">/</span>
                <h3 className="text-3xl font-black text-white">{stats?.tests}</h3>
                <span className="text-xs text-gray-500 font-bold">TESTS</span>
             </div>
          </div>

          {/* Performance */}
          <div className="bg-[#0a0a0a] border border-green-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-green-500/60 transition-all shadow-[0_0_30px_-10px_rgba(34,197,94,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                   <Award size={24} />
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Avg Result</p>
             </div>
             <h3 className="text-4xl font-black text-white mt-2">{stats?.avgResult?.toFixed(1)}%</h3>
             <p className="text-xs text-gray-500 mt-2 font-mono">{stats?.totalAttempts} TESTS TAKEN</p>
          </div>

       </div>
       
       {/* --- GRAPH & LISTS SECTION --- */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- BEAUTIFUL NEON GRAPH START --- */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
             
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>

             <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Activity className="text-yellow-400 fill-yellow-400/20" size={28} /> 
                    Revenue Analytics
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 ml-10">Monthly financial performance overview</p>
                </div>
                <div className="flex gap-2">
                   <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/5">Last 6 Months</span>
                </div>
             </div>
             
             <div className="h-[350px] w-full flex-1 relative z-10">
                {stats?.graphData && stats.graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {/* Enhanced Gradient */}
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4}/>
                          <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.1}/>
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      
                      <XAxis 
                        dataKey="name" 
                        stroke="#444" 
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#666', fontSize: 12, fontWeight: 'bold'}} 
                        dy={10}
                      />
                      
                      <YAxis 
                        stroke="#444" 
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#666', fontSize: 12}} 
                        tickFormatter={(value) => `₹${value/1000}k`}
                      />
                      
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fbbf24', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.5 }} />
                      
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#fbbf24" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        activeDot={{ r: 8, stroke: '#fbbf24', strokeWidth: 4, fill: '#000' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <p>Not enough data to display graph</p>
                  </div>
                )}
             </div>
          </div>
          {/* --- GRAPH END --- */}

          {/* SIDEBAR: Recent Joinings */}
          <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-[2.5rem] flex flex-col h-[500px]">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 px-2">
                <Users className="text-blue-400" size={20} />
                Recent Students
             </h3>
             
             <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {stats?.recentStudents?.length > 0 ? (
                  stats.recentStudents.map((enroll) => (
                    <div key={enroll._id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group cursor-pointer">
                       <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                          {enroll.user?.name?.[0]?.toUpperCase() || "S"}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{enroll.user?.name || "Student"}</p>
                          <p className="text-gray-500 text-xs truncate">{enroll.user?.email}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded-lg">+₹{enroll.amount}</p>
                       </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-10 italic">No recent enrollments found.</p>
                )}
             </div>
          </div>

       </div>
    </div>
  );
};

// 3. TESTS SELECTION TAB (UI Update)
const TestsSelection = ({ onSelect }) => {
  return (
    <div className="p-4 md:p-20 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-3">EXAM CONTROL CENTER</h2>
        <p className="text-gray-400">Select the examination format to proceed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MCQ Card */}
        <div onClick={() => onSelect('mcq')} className="group relative bg-[#0a0a0a] border border-cyan-500/20 rounded-[2rem] p-8 cursor-pointer hover:border-cyan-400 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-cyan-500/10 transition-all"></div>
          <CheckSquare className="w-12 h-12 text-cyan-500 mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">Objective (MCQ)</h3>
          <p className="text-gray-500 text-sm mb-6">Automated grading, quizzes, and entrance test patterns.</p>
          <div className="text-cyan-400 font-bold text-sm flex items-center">Manage MCQs <ChevronRight size={16} /></div>
        </div>

        {/* Subjective Card */}
        <div onClick={() => onSelect('subjective')} className="group relative bg-[#0a0a0a] border border-fuchsia-500/20 rounded-[2rem] p-8 cursor-pointer hover:border-fuchsia-400 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-fuchsia-500/10 transition-all"></div>
          <FileEdit className="w-12 h-12 text-fuchsia-500 mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">Subjective (Written)</h3>
          <p className="text-gray-500 text-sm mb-6">Manual evaluation for detailed theory answers.</p>
          <div className="text-fuchsia-400 font-bold text-sm flex items-center">Manage Theory <ChevronRight size={16} /></div>
        </div>
      </div>
    </div>
  );
};

// Generic Helper
const GenericListTab = ({ type }) => (
  <div className="flex items-center justify-center h-96 border border-dashed border-gray-800 rounded-3xl m-8">
    <div className="text-center">
       <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
          <File size={24} />
       </div>
       <h3 className="text-gray-400 font-bold">{type} Module</h3>
       <p className="text-gray-600 text-sm">Coming Soon</p>
    </div>
  </div>
);

// --- MAIN EXPORT ---
export default function ClassroomContent({ activeTab, courseData }) {
  const courseId = courseData?._id;
  
  // State for Tests View
  const [testView, setTestView] = useState('selection'); 

  // Reset test view on tab change
  if (activeTab !== 'tests' && testView !== 'selection') {
     setTestView('selection');
  }

  // Router for Tests
  if (activeTab === 'tests') {
      if (testView === 'mcq') return <div className="p-4 md:p-8 max-w-7xl mx-auto"><MCQManager courseId={courseId} onBack={() => setTestView('selection')} /></div>;
      if (testView === 'subjective') return <div className="p-4 md:p-8 max-w-7xl mx-auto"><SubjectiveManager courseId={courseId} onBack={() => setTestView('selection')} /></div>;
      return <TestsSelection onSelect={setTestView} />;
  }

  // Main Switch
  switch (activeTab) {
    case "overview": return <OverviewTab courseId={courseId} />; 
    
    case "live": return <LiveClassManager courseId={courseId} />;
    case "notices": return <NoticeBoard courseId={courseId} isAdmin={true} />;
    case "syllabus": return <SyllabusManager courseId={courseId} />;
    case "lectures": return <LectureManager courseId={courseId} />;
    case "materials": return <MaterialsManager courseId={courseId} />;
    case "fees": return <FeeManagement courseId={courseId} />;
    case "attendance": return <div className="p-10 text-center text-gray-500">Attendance Module (Coming Soon)</div>;
    case "assignments": return <GenericListTab type="Assignments" />;
    default: return <div className="p-10 text-center text-gray-500">Select a tab to view content</div>;
  }
}