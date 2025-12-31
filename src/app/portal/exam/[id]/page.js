"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Clock, ChevronRight, Menu, Flag, RotateCcw, AlertTriangle, CheckCircle, Shield, XCircle, LogIn, ChevronLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamPortalPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); 
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warnings, setWarnings] = useState(0);

  // Security: Full Screen & Tab Detection
  useEffect(() => {
    if (loading || error) return; 

    const handleVisibilityChange = () => {
        if (document.hidden) {
            setWarnings(prev => prev + 1);
            toast.error(`WARNING: Do not switch tabs! (${warnings + 1}/3)`, { 
                icon: "⚠️",
                style: { background: '#ef4444', color: '#fff' }
            });
            if(warnings >= 2) {
                handleSubmit(true); 
            }
        }
    };

    const enterFullScreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.log("Fullscreen denied/cancelled");
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    enterFullScreen();

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [warnings, loading, error]);

  // Fetch Exam Data
  useEffect(() => {
    const startExam = async () => {
      console.log("🚀 Client: Starting Exam Fetch for ID:", testId); 

      try {
        const res = await fetch(`/api/exam/${testId}/start`);
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error("Invalid Server Response (Not JSON)");
        }

        if (res.status === 401) {
            setError("Session Expired. Please Login again.");
            toast.error("Session Expired");
            setTimeout(() => router.push("/login"), 2000);
            return;
        }

        if (!res.ok) {
           throw new Error(data.error || `Server Error: ${res.statusText}`);
        }

        if (!data.test || !data.test.questions) {
            throw new Error("Exam data is empty or invalid.");
        }

        setTest(data.test);
        setQuestions(data.test.questions);
        const durationSec = (data.test.duration || 60) * 60;
        setTimeLeft(durationSec);
        setLoading(false);

      } catch (error) {
        console.error("🔥 Client Error:", error);
        setError(error.message); 
        setLoading(false);
      }
    };

    if (testId) startExam();
  }, [testId, router]);

  // Timer Logic
  useEffect(() => {
    if (!loading && !error && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
           if(prev <= 1) {
               clearInterval(timer);
               handleSubmit(true);
               return 0;
           }
           return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, error, timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h+':' : ''}${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  };

  const handleSubmit = async (auto = false) => {
      if(!auto && !confirm("Are you sure you want to submit?")) return;
      setIsSubmitting(true);
      try {
          const answersArray = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : -1);
          const res = await fetch(`/api/exam/${testId}/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: answersArray, timeTaken: (test.duration * 60) - timeLeft })
          });
          if(res.ok) {
              toast.success("Exam Submitted Successfully!");
              router.replace(`/dashboard/classroom/${test.courseId}/tests/${testId}/result`);
          } else {
              toast.error("Submission Failed");
              setIsSubmitting(false);
          }
      } catch (error) {
          toast.error("Network Error");
          setIsSubmitting(false);
      }
  };

  // --- RENDERING STATES ---

  if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 border-t-4 border-b-4 border-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
                    <Shield size={20} className="md:w-6 md:h-6" />
                </div>
            </div>
            <p className="text-cyan-500 font-mono text-xs md:text-base tracking-widest animate-pulse">CONNECTING SECURELY...</p>
        </div>
  );

  if (error) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <XCircle size={64} className="text-red-500 mb-6" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Access Denied</h2>
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-8 max-w-lg">
              <p className="text-red-200 font-mono text-xs md:text-sm break-all">{error}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push("/dashboard")} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 text-sm">Return</button>
          </div>
      </div>
  );

  const currentQ = questions[currentQIndex];

  return (
    <div className="fixed inset-0 bg-[#030303] text-white flex flex-col overflow-hidden font-sans select-none">
        
        {/* HEADER (Mobile Compact) */}
        <header className="h-14 md:h-16 bg-[#080808] border-b border-white/5 flex items-center justify-between px-3 md:px-6 z-20 shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    <Shield className="text-black" size={16} />
                </div>
                <div>
                    <h1 className="font-bold text-xs md:text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 line-clamp-1 max-w-[150px] md:max-w-none">
                        {test.title}
                    </h1>
                    <p className="text-[9px] md:text-[10px] text-cyan-500 font-mono tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span> SECURE
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className={`flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-5 md:py-2 rounded-full border border-white/5 bg-[#111] shadow-inner ${timeLeft < 300 ? 'text-red-500 shadow-red-900/20 animate-pulse' : 'text-cyan-400 shadow-cyan-900/10'}`}>
                    <Clock size={14} className="md:w-[18px]" />
                    <span className="font-mono text-sm md:text-xl font-bold tracking-widest">{formatTime(timeLeft)}</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10 md:border-none md:bg-transparent">
                    <Menu size={20} className="md:w-6 md:h-6"/>
                </button>
            </div>
        </header>

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
            <main className="flex-1 flex flex-col relative z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-[#030303] to-[#030303]">
                {/* Progress Bar */}
                <div className="h-0.5 md:h-0.5 bg-gray-900 w-full">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                       className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    ></motion.div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-10 scroll-smooth custom-scrollbar">
                    <div className="max-w-5xl mx-auto pb-20">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={currentQIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

                                {/* Question Header */}
                                <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
                                    <h2 className="text-base md:text-2xl font-bold text-gray-100 leading-relaxed pr-2">
                                        <span className="text-cyan-500 mr-2 md:mr-3 text-xl md:text-3xl font-black">Q{currentQIndex + 1}</span>
                                        {currentQ.questionText}
                                    </h2>
                                    <span className="bg-white/5 border border-white/10 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs text-gray-400 font-mono tracking-wider whitespace-nowrap">
                                        {currentQ.marks || 1} Marks
                                    </span>
                                </div>

                                {/* Options Grid */}
                                <div className="grid gap-3 md:gap-4 pl-0 md:pl-4 relative z-10">
                                    {currentQ.options.map((opt, idx) => {
                                        const isSelected = answers[currentQIndex] === idx;
                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => setAnswers(prev => ({ ...prev, [currentQIndex]: idx }))}
                                                className={`
                                                    group relative flex items-center gap-3 md:gap-5 p-3 md:p-5 rounded-xl md:rounded-2xl border cursor-pointer transition-all duration-300 active:scale-[0.98]
                                                    ${isSelected 
                                                        ? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                                                        : 'border-white/5 bg-[#111] hover:bg-[#151515] hover:border-white/20 hover:shadow-lg'}
                                                `}
                                            >
                                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-cyan-400 bg-cyan-400 scale-110' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm md:text-lg transition-colors ${isSelected ? 'text-cyan-100 font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>{opt}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* BOTTOM CONTROLS (App Style) */}
                <div className="h-16 md:h-24 bg-[#080808] border-t border-white/5 flex items-center justify-between px-4 md:px-12 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] safe-area-bottom">
                    
                    {/* Left: Tools */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={() => setMarkedForReview(prev => ({...prev, [currentQIndex]: !prev[currentQIndex]}))} 
                            className={`p-3 md:px-5 md:py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                            ${markedForReview[currentQIndex] ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-gray-400'}`}>
                            <Flag size={18} fill={markedForReview[currentQIndex] ? "currentColor" : "none"}/>
                            <span className="hidden md:inline">Review</span>
                        </button>
                        <button onClick={() => { const n={...answers}; delete n[currentQIndex]; setAnswers(n); }} 
                            className="p-3 md:px-5 md:py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                            <RotateCcw size={18}/> <span className="hidden md:inline">Reset</span>
                        </button>
                    </div>

                    {/* Right: Navigation */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)} 
                            className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-white/5 active:bg-white/10 text-white font-bold disabled:opacity-20 disabled:cursor-not-allowed transition-all text-sm md:text-base">
                            <span className="md:hidden"><ChevronLeft size={20}/></span>
                            <span className="hidden md:inline">Previous</span>
                        </button>
                        
                        {currentQIndex === questions.length - 1 ? (
                             <button onClick={() => handleSubmit(false)} disabled={isSubmitting} 
                                className="px-5 py-2.5 md:px-10 md:py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 text-white font-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2 text-xs md:text-base">
                                {isSubmitting ? '...' : 'SUBMIT'} <CheckCircle size={16} className="md:w-5 md:h-5"/>
                             </button>
                        ) : (
                            <button onClick={() => setCurrentQIndex(prev => prev + 1)} 
                                className="px-5 py-2.5 md:px-10 md:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 active:scale-95 text-white font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 text-sm md:text-base">
                                <span className="hidden md:inline">Next</span> <ChevronRight size={20} strokeWidth={3}/>
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* SIDEBAR PALETTE (App Drawer Style) */}
            <aside className={`absolute md:relative top-0 right-0 h-full w-72 md:w-80 bg-[#0a0a0a] border-l border-white/5 z-30 transform transition-transform duration-300 ease-out shadow-[-10px_0_30px_rgba(0,0,0,0.8)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <div className="p-4 md:p-5 border-b border-white/5 bg-[#0f0f0f] font-bold text-gray-300 text-sm flex items-center justify-between">
                    <span>Question Palette</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-400"><XCircle size={20}/></button>
                </div>
                
                <div className="p-4 md:p-6 overflow-y-auto h-[calc(100%-60px)] custom-scrollbar">
                    <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
                        {questions.map((_, idx) => {
                            const isCurr = currentQIndex === idx;
                            const hasAns = answers[idx] !== undefined;
                            const isMarked = markedForReview[idx];
                            
                            return (
                                <button key={idx} onClick={() => { setCurrentQIndex(idx); setIsSidebarOpen(false); }} 
                                    className={`aspect-square rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm border transition-all relative overflow-hidden
                                    ${isCurr ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110 z-10' : 
                                      isMarked ? 'bg-purple-900/40 text-purple-300 border-purple-500/50' : 
                                      hasAns ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50' : 
                                      'bg-[#151515] text-gray-600 border-white/5 hover:border-white/20'}`}>
                                    {idx + 1}
                                    {isMarked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_5px_currentColor]"></div>}
                                </button>
                            )
                        })}
                    </div>
                    <div className="mt-8 space-y-3 text-[10px] md:text-xs font-mono text-gray-500">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-emerald-900/40 border border-emerald-500/50"></div> Answered</div>
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-purple-900/40 border border-purple-500/50"></div> Marked for Review</div>
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-[#151515] border border-white/5"></div> Not Visited</div>
                    </div>
                </div>
            </aside>
            
            {/* Backdrop for Mobile Sidebar */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </div>
    </div>
  );
}