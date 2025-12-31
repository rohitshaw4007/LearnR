"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, Clock, Trophy, Loader2, Zap, BarChart, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 12 } 
  },
  hover: { 
    y: -5,
    scale: 1.01,
    boxShadow: "0px 10px 30px rgba(234, 179, 8, 0.2)",
    borderColor: "rgba(234, 179, 8, 0.8)",
    transition: { duration: 0.2 }
  }
};

// --- HELPER COMPONENT ---
const CountdownTimer = ({ scheduledAt }) => {
  const [timeLeft, setTimeLeft] = useState("...");

  useEffect(() => {
    const calculateTime = () => {
      const startTime = new Date(scheduledAt).getTime();
      const WINDOW_DURATION = 12 * 60 * 60 * 1000; 
      const endTime = startTime + WINDOW_DURATION;
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("Closed");
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt]);

  return <span className="font-mono text-yellow-400 font-bold tracking-widest">{timeLeft}</span>;
};

export default function StudentTestViewer({ courseId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      if(!courseId) return;
      try {
        const res = await fetch(`/api/courses/${courseId}/tests?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && isMounted) {
            setTests(data.tests);
        }
      } catch (error) {
        console.error("🔥 Error:", error);
      } finally {
        if(isMounted) setLoading(false);
      }
    };
    fetchTests();
    return () => { isMounted = false; };
  }, [courseId]);

  const getExamStatus = (test) => {
    if (test.isAttempted) return "ATTEMPTED";
    const now = new Date();
    const start = new Date(test.scheduledAt);
    const end = new Date(start.getTime() + (12 * 60 * 60 * 1000));

    if (test.status === 'live') return "LIVE";
    if (test.status === 'completed' || now > end) return "ENDED";
    if (now < start) return "UPCOMING";
    return "UPCOMING";
  };

  const handleCardClick = (e, test) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (navigating) return;

    const status = getExamStatus(test);

    if (status === "UPCOMING") {
      toast("Exam starts soon!", { icon: "🔒", style: { background: '#222', color: '#fbbf24', border: '1px solid #fbbf24' } });
      return;
    }

    setNavigating(true);
    let targetUrl = "";

    if (status === "LIVE") {
        if (!window.confirm(`⚠️ READY TO START?\n\nExam: ${test.title}\nMode: Fullscreen Proctored`)) {
            setNavigating(false);
            return;
        }
        targetUrl = `/portal/exam/${test._id}`;
    } 
    else if (status === "ATTEMPTED") {
        targetUrl = `/dashboard/classroom/${courseId}/tests/${test._id}/result`;
    } 
    else if (status === "ENDED") {
        targetUrl = `/dashboard/classroom/${courseId}/tests/${test._id}/leaderboard`;
    }

    if (targetUrl) {
        router.push(targetUrl);
    } else {
        setNavigating(false);
    }
  };

  const filteredTests = useMemo(() => {
    let data = tests || [];
    if (searchQuery) data = data.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return data;
  }, [tests, searchQuery]);

  const featuredTest = useMemo(() => {
      return filteredTests.find(t => getExamStatus(t) === "LIVE") || 
             filteredTests.find(t => getExamStatus(t) === "UPCOMING") || 
             filteredTests[0];
  }, [filteredTests]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-black gap-4">
        <Loader2 className="animate-spin text-yellow-500" size={48} />
        <p className="text-yellow-500/50 font-mono tracking-[0.5em] animate-pulse">LOADING SYSTEM...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-3 md:p-8 pb-32 font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* 1. LOADING OVERLAY */}
      <AnimatePresence>
      {navigating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center"
          >
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="animate-spin text-yellow-500 relative z-10" size={60}/>
              </div>
              <h2 className="text-2xl font-black text-white mt-6 tracking-wider">INITIALIZING<span className="text-yellow-500">...</span></h2>
          </motion.div>
      )}
      </AnimatePresence>

      {/* 2. HEADER */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-12 flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6 border-b border-white/10 pb-4 md:pb-8">
        <div>
            <div className="flex items-center gap-2 mb-1 md:mb-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]"></span>
                <p className="text-yellow-500 text-[10px] md:text-xs font-mono font-bold tracking-widest uppercase">Live Examination Portal</p>
            </div>
            <h1 className="text-2xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 uppercase italic">
                Battle<span className="text-yellow-500">Ground</span>
            </h1>
        </div>
        
        {/* Search Bar */}
        <div className="w-full md:w-96 relative group mt-2 md:mt-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex items-center bg-[#0a0a0a] rounded-lg border border-white/10 p-1">
                <Search className="text-gray-500 ml-3" size={16}/>
                <input 
                  type="text" 
                  placeholder="Find mission..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-white px-3 py-2 text-sm focus:ring-0 placeholder:text-gray-600 outline-none"
                />
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-16">
        
        {/* 3. FEATURED CARD (Adaptive: Banner on Mobile, Big Card on PC) */}
        {featuredTest && (() => {
             const status = getExamStatus(featuredTest);
             const isLive = status === 'LIVE';

             return (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full group cursor-pointer"
                    onClick={(e) => status !== 'UPCOMING' && handleCardClick(e, featuredTest)}
                >
                    <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-30 transition-all duration-500 group-hover:opacity-60 ${isLive ? 'bg-gradient-to-r from-red-600 to-yellow-600' : 'bg-gray-800'}`}></div>

                    <div className="relative bg-[#050505] border border-white/10 rounded-xl md:rounded-2xl overflow-hidden p-4 md:p-12 hover:border-yellow-500/50 transition-colors duration-300">
                        {/* PC Only Decoration */}
                        <div className="hidden md:block absolute top-0 right-0 p-10 opacity-10">
                            <div className="w-32 h-32 border-r-2 border-t-2 border-yellow-500 rounded-tr-3xl"></div>
                        </div>

                        <div className="flex flex-row md:flex-row gap-4 md:gap-8 justify-between items-center relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 md:mb-6">
                                    <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-sm text-[10px] md:text-xs font-black tracking-widest border ${isLive ? 'bg-red-500/10 text-red-500 border-red-500 animate-pulse' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'}`}>
                                        {status}
                                    </span>
                                    {isLive && <div className="hidden md:flex items-center gap-2 text-yellow-500 text-xs md:text-base"><Clock size={14}/><CountdownTimer scheduledAt={featuredTest.scheduledAt}/></div>}
                                </div>
                                
                                <h2 className="text-lg md:text-5xl font-black text-white mb-1 md:mb-6 uppercase leading-tight line-clamp-1 md:line-clamp-2">
                                    {featuredTest.title}
                                </h2>
                                
                                <div className="flex items-center gap-4 text-[10px] md:text-sm text-gray-400 font-mono">
                                    <div className="flex items-center gap-1 md:gap-2"><Zap size={12} className="text-yellow-500"/> {featuredTest.duration}m</div>
                                    <div className="flex items-center gap-1 md:gap-2"><Trophy size={12} className="text-yellow-500"/> {featuredTest.totalMarks} pts</div>
                                </div>
                            </div>

                            <div>
                                <button type="button" className={`p-2 md:px-8 md:py-4 bg-yellow-500 text-black font-black text-xs md:text-lg uppercase tracking-wider rounded-lg md:rounded hover:bg-white transition-colors flex items-center justify-center gap-2 ${status === 'UPCOMING' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <span className="hidden md:inline">{status === 'LIVE' ? "START MISSION" : "VIEW DATA"}</span>
                                    <ChevronRight size={18} strokeWidth={3}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
             );
        })()}

        {/* 4. GRID CARDS (Mobile: Compact List | PC: Grid) */}
        {filteredTests.length > 0 ? (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
            >
                {filteredTests.filter(t => t._id !== featuredTest?._id).map((test) => {
                    const status = getExamStatus(test);
                    const isLive = status === 'LIVE';

                    return (
                        <motion.div
                            key={test._id}
                            variants={cardVariants}
                            whileHover="hover"
                            onClick={(e) => status !== 'UPCOMING' && handleCardClick(e, test)}
                            // Changed Layout for Mobile: flex-row (Ad/Banner style) vs flex-col (Card style)
                            className={`
                                relative bg-[#080808] border border-white/5 rounded-lg md:rounded-xl cursor-pointer group overflow-hidden
                                p-3 md:p-6
                                flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0
                                ${status === 'UPCOMING' ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            {/* Mobile Icon / PC Top Row */}
                            <div className="flex-shrink-0 md:w-full md:flex md:justify-between md:items-start md:mb-4">
                                <div className="p-2 md:p-3 bg-white/5 rounded-lg group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                                    <BarChart className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                                </div>
                                <span className={`hidden md:inline-block text-[10px] font-bold px-2 py-1 rounded border ${isLive ? 'text-red-500 border-red-500/50' : 'text-gray-500 border-gray-800'}`}>
                                    {status}
                                </span>
                            </div>

                            {/* Content Middle */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm md:text-xl font-bold text-white md:mb-2 truncate group-hover:text-yellow-400 transition-colors">
                                    {test.title}
                                </h3>
                                
                                {/* Mobile Status Line */}
                                <div className="md:hidden text-[10px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                                    <span className={`${isLive ? 'text-red-500 font-bold' : ''}`}>{status}</span> • {test.totalMarks} pts
                                </div>

                                {/* PC Info */}
                                {isLive && (
                                    <div className="hidden md:flex text-[10px] md:text-xs text-red-500 mb-3 md:mb-4 font-mono items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                                        Ends: <CountdownTimer scheduledAt={test.scheduledAt} />
                                    </div>
                                )}

                                <div className="hidden md:flex border-t border-white/5 mt-3 md:mt-4 pt-3 md:pt-4 justify-between text-[10px] md:text-xs text-gray-500 font-mono w-full">
                                    <span>DURATION: {test.duration}m</span>
                                    <span>SCORE: {test.totalMarks}</span>
                                </div>
                            </div>

                            {/* Mobile Arrow */}
                            <div className="md:hidden text-gray-600">
                                <ChevronRight size={16}/>
                            </div>

                        </motion.div>
                    );
                })}
            </motion.div>
        ) : (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02]">
                <Trophy size={64} className="mx-auto text-gray-800 mb-4"/>
                <p className="text-gray-600">NO MISSIONS FOUND</p>
            </div>
        )}

      </div>
    </div>
  );
}