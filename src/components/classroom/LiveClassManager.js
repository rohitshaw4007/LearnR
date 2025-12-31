"use client";
import { useState, useEffect, useRef } from "react";
import { MicOff, Video as VideoIcon, Send, Save, Youtube, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";

// --- HELPER: Validate YouTube ID ---
const isValidYoutubeID = (id) => {
  const regex = /^[a-zA-Z0-9_-]{11}$/;
  return regex.test(id);
};

export default function LiveClassManager({ courseId }) {
  const [isLive, setIsLive] = useState(false);
  const [youtubeId, setYoutubeId] = useState(""); 
  const [lectureTitle, setLectureTitle] = useState("");
  const [showControls, setShowControls] = useState(true); // Toggle controls on mobile
  
  // Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  // Ref for auto-scrolling chat
  const chatContainerRef = useRef(null);

  // --- 1. RELOAD FIX: Check if already live on mount ---
  useEffect(() => {
    const checkExistingSession = async () => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/live`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.isLive) {
                    setIsLive(true);
                    setYoutubeId(data.youtubeId || "");
                    setLectureTitle(data.topic || "");
                    setShowControls(false); // Auto hide controls if live on mobile
                    toast.success("Resumed live session");
                }
            }
        } catch (error) { console.error("Failed to restore session", error); }
    };
    checkExistingSession();
  }, [courseId]);

  // --- 2. Chat Polling ---
  const fetchMessages = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/live/chat?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch (error) { console.error("Chat error", error); }
  };

  useEffect(() => {
    let interval;
    if (isLive) {
      fetchMessages(); 
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive, courseId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- 3. SEND MESSAGE ---
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const tempMsg = {
      _id: Date.now(),
      senderName: "Instructor (You)",
      senderRole: "admin",
      message: chatMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setChatMessage("");

    try {
      await fetch('/api/live/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            courseId, 
            senderName: "Instructor", 
            senderRole: "admin", 
            message: tempMsg.message 
        }) 
      });
    } catch (error) { toast.error("Message failed"); }
  };

  // --- 4. GO LIVE FUNCTION ---
  const handleGoLive = async () => {
    if (!lectureTitle.trim()) return toast.error("Enter topic name");
    if (!isValidYoutubeID(youtubeId)) return toast.error("Invalid YouTube ID");

    const loadingToast = toast.loading("Starting Live...");

    try {
        const res = await fetch(`/api/courses/${courseId}/live`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isLive: true, youtubeId, topic: lectureTitle })
        });

        if (!res.ok) throw new Error("Failed");

        setIsLive(true);
        setShowControls(false); // Hide controls to show video better
        toast.dismiss(loadingToast);
        toast.success("You are LIVE!");

    } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Error going live");
    }
  };

  // --- 5. END CLASS FUNCTION ---
  const handleEndClassAndSave = async () => {
    if (!confirm("End class and save recording?")) return;

    const loadingToast = toast.loading("Ending...");
    try {
      await fetch("/api/admin/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId,
          title: lectureTitle,
          chapter: "Live Recordings",
          description: `Live Session recorded on ${new Date().toLocaleDateString()}`,
          videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`, 
          thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          isPreview: false,
          order: 999
        }),
      });

      await fetch(`/api/courses/${courseId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: false, youtubeId: "", topic: "" })
      });

      toast.dismiss(loadingToast);
      toast.success("Ended & Saved!");
      setIsLive(false);
      setYoutubeId("");
      setLectureTitle("");
      setMessages([]);
      setShowControls(true);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed save");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] md:flex-row bg-black overflow-hidden animate-in fade-in duration-300">
       
       {/* LEFT SIDE: Video Stage */}
       <div className="flex-1 bg-[#111] relative flex flex-col border-r border-white/10 h-[40vh] md:h-full">
          
          {/* Mobile Control Toggle */}
          <div className="md:hidden flex justify-between items-center p-2 bg-[#111] border-b border-white/10">
             <span className="text-xs font-bold text-white uppercase">{isLive ? "🔴 Live Now" : "Setup Class"}</span>
             <button onClick={() => setShowControls(!showControls)} className="text-white p-1">
                {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
          </div>

          {/* Controls Area */}
          <div className={`${showControls ? 'flex' : 'hidden'} md:flex flex-wrap gap-3 p-3 md:p-4 bg-[#0a0a0a] border-b border-white/10 z-10 transition-all`}>
              {!isLive ? (
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                   <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 flex-1">
                      <Youtube size={16} className="text-red-500 flex-shrink-0" />
                      <input 
                        value={youtubeId}
                        onChange={(e) => setYoutubeId(e.target.value.trim())}
                        placeholder="Video ID (e.g. dQw4w9WgXcQ)" 
                        className="bg-transparent text-xs md:text-sm text-white outline-none w-full placeholder-gray-600"
                      />
                   </div>
                   <input 
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="Topic Name..." 
                      className="bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-xs md:text-sm text-white outline-none placeholder-gray-600 min-w-[150px]"
                   />
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-white font-bold text-xs md:text-sm truncate max-w-[200px]">{lectureTitle}</span>
                </div>
              )}

              <button 
                onClick={isLive ? handleEndClassAndSave : handleGoLive}
                className={`w-full md:w-auto px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                  isLive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                }`}
              >
                {isLive ? <><Save size={14}/> END</> : "GO LIVE"}
              </button>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center bg-black relative w-full h-full overflow-hidden">
             {isLive && youtubeId ? (
                <iframe 
                  className="w-full h-full aspect-video"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&vq=hd1080`} 
                  title="Live Class" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
             ) : (
                <div className="text-center p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full mb-4 flex items-center justify-center animate-pulse">
                      <VideoIcon size={24} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-xs max-w-xs">
                      Enter YouTube ID & Click Go Live
                    </p>
                </div>
             )}
          </div>
       </div>

       {/* RIGHT SIDE: Chat Area */}
       <div className="flex-1 md:w-80 md:flex-none bg-[#0f0f0f] flex flex-col h-full border-l border-white/10">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">Live Chat</span>
             <span className="text-[10px] text-gray-500">{messages.length} msgs</span>
          </div>
          
          <div ref={chatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0f0f0f]">
             {!isLive ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs gap-2">
                   <MicOff size={20} className="opacity-50"/>
                   <span>Chat Disabled</span>
                </div>
             ) : messages.length === 0 ? (
                <div className="text-center text-gray-600 text-xs mt-10">No messages yet.</div>
             ) : (
                messages.map((msg, i) => (
                   <div key={i} className={`flex flex-col ${msg.senderRole === 'admin' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs md:text-sm ${
                         msg.senderRole === 'admin' 
                         ? 'bg-yellow-400 text-black rounded-tr-none' 
                         : 'bg-[#222] text-white rounded-tl-none border border-white/10'
                      }`}>
                         <p className="text-[9px] font-bold mb-0.5 opacity-70 uppercase">
                            {msg.senderName} {msg.senderRole==='admin' && '(You)'}
                         </p>
                         {msg.message}
                      </div>
                   </div>
                ))
             )}
          </div>

          <div className="p-3 bg-[#0a0a0a] border-t border-white/10 flex gap-2">
             <input 
                disabled={!isLive}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-white/5 rounded-full px-4 py-2 text-xs md:text-sm text-white outline-none focus:bg-white/10 transition-colors disabled:opacity-50" 
                placeholder={isLive ? "Type..." : "Offline"} 
             />
             <button 
                disabled={!isLive || !chatMessage.trim()}
                onClick={handleSendMessage}
                className="p-2 bg-yellow-400 rounded-full text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors flex-shrink-0"
             >
                <Send size={16}/>
             </button>
          </div>
       </div>
    </div>
  );
};