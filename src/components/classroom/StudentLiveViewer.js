"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Video, MicOff, AlertCircle, Maximize2, MessageCircle } from "lucide-react";

export default function StudentLiveViewer({ courseId, studentName }) {
  const [isLive, setIsLive] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(true); // Toggle for mobile
  
  const chatRef = useRef(null);

  // 1. Check Live Status
  const checkLiveStatus = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        setIsLive(data.isLive);
      }
    } catch (err) { console.error("Error checking live status", err); }
  };

  useEffect(() => {
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 5000); 
    return () => clearInterval(interval);
  }, [courseId]);

  // 2. Chat Logic
  const fetchMessages = async () => {
    if(!isLive || !courseId) return;
    try {
      const res = await fetch(`/api/live/chat?courseId=${courseId}`);
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isLive, courseId]);

  useEffect(() => {
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const sender = studentName || "Student";
    const tempMsg = { 
        _id: Date.now(), 
        senderName: sender, 
        senderRole: "student", 
        message: chatMessage, 
        timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setChatMessage("");

    try {
        await fetch('/api/live/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                courseId, 
                senderName: sender,
                senderRole: "student", 
                message: tempMsg.message 
            })
        });
    } catch(e) { console.error(e); }
  };

  if (!isLive) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
         <div className="w-20 h-20 md:w-24 md:h-24 bg-yellow-400/10 rounded-full flex items-center justify-center animate-pulse">
            <Video size={32} className="text-yellow-400 md:w-10 md:h-10" />
         </div>
         <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">No Live Class Right Now</h2>
            <p className="text-gray-400 mt-2 text-sm md:text-base">The instructor is offline. Please check back later.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-140px)] gap-0 md:gap-6 lg:p-6 animate-in fade-in slide-in-from-bottom-4 bg-black md:bg-transparent">
       
       {/* Video Section (Top on Mobile) */}
       <div className={`flex-shrink-0 w-full lg:flex-1 flex flex-col space-y-0 md:space-y-4 bg-black z-20 ${showChatOnMobile ? 'h-[35vh] md:h-auto' : 'h-full'}`}>
          <div className="w-full h-full aspect-video md:aspect-auto md:bg-black md:rounded-2xl overflow-hidden border-b md:border border-white/10 shadow-2xl relative group">
             <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${liveData?.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&vq=hd1080`} 
                title="Live Class" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
             ></iframe>
             <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-red-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold animate-pulse shadow-lg flex items-center gap-2 pointer-events-none">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></span> LIVE
             </div>
             
             {/* Mobile Only: Toggle Chat Button Overlay */}
             <button 
                onClick={() => setShowChatOnMobile(!showChatOnMobile)}
                className="md:hidden absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md border border-white/20 z-30"
             >
                {showChatOnMobile ? <Maximize2 size={16} /> : <MessageCircle size={16} />}
             </button>
          </div>
          
          {/* Title - Hidden on small mobile screens to save space */}
          <div className="hidden md:block">
             <h1 className="text-lg md:text-2xl font-bold text-white line-clamp-2">{liveData?.topic}</h1>
             <p className="text-gray-500 text-xs md:text-sm mt-1">Started at: {new Date(liveData?.startedAt).toLocaleTimeString()}</p>
          </div>
       </div>

       {/* Chat Section (Bottom on Mobile) */}
       <div className={`${showChatOnMobile ? 'flex' : 'hidden'} md:flex w-full lg:w-96 bg-[#111] md:border border-white/10 rounded-none md:rounded-2xl flex-col overflow-hidden flex-1 md:h-auto shadow-xl`}>
          <div className="p-3 md:p-4 border-b border-white/10 bg-[#161616] flex justify-between items-center">
             <span className="font-bold text-white text-sm md:text-base">Live Chat</span>
             <span className="text-[10px] md:text-xs text-green-400 flex items-center gap-1">● Online</span>
          </div>
          
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800 bg-black/20">
             {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderRole === 'student' && msg.senderName === studentName ? 'items-end' : 'items-start'}`}>
                    {/* Fixed: Added break-words and whitespace-pre-wrap for long text handling */}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs md:text-sm break-words whitespace-pre-wrap ${
                        msg.senderRole === 'admin' 
                        ? 'bg-yellow-400 text-black border border-yellow-500 font-medium' 
                        : (msg.senderName === studentName ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-200 border border-white/5')
                    }`}>
                        <p className="text-[9px] md:text-[10px] font-bold opacity-70 mb-0.5 uppercase">{msg.senderName}</p>
                        {msg.message}
                    </div>
                </div>
             ))}
          </div>

          <div className="p-3 bg-[#0f0f0f] border-t border-white/10 pb-6 md:pb-3">
             <div className="flex gap-2">
                <input 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs md:text-sm text-white outline-none focus:border-yellow-400/50 transition-colors"
                  placeholder="Chat here..."
                />
                <button onClick={handleSendMessage} className="bg-yellow-400 hover:bg-yellow-300 text-black p-2 rounded-full transition-colors flex-shrink-0">
                   <Send size={18} className="md:w-[20px] md:h-[20px]"/>
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}