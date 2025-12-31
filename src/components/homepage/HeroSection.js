import Link from "next/link";

export default function HeroSection() {
  return (
    // FIX: 'min-h-screen' और 'pt-20' जोड़ा गया है ताकि कंटेंट Navbar के नीचे से शुरू हो
    <div className="relative overflow-hidden bg-black min-h-screen flex items-center pt-20">
      
      {/* --- BACKGROUND (NO CHANGES) --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gray-800/40 via-[#050505] to-black z-0" />
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Blobs */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none z-0 animate-[pulse_12s_ease-in-out_infinite]" />
      {/* --- BACKGROUND END --- */}


      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full relative z-10">
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          
          {/* --- LEFT SIDE (TEXT) --- */}
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left flex flex-col justify-center">
            
            {/* Tagline */}
            <div className="inline-flex items-center text-xs sm:text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-3 sm:mb-4">
              <span className="w-6 sm:w-8 h-[2px] bg-yellow-400 mr-2 sm:mr-3 animate-pulse"></span>
              Premium English Coaching
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Unlock Your <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 animate-[pulse_6s_ease-in-out_infinite]">Potential.</span>
              Master English.
            </h1>
            
            {/* Subtext */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-300 sm:text-xl lg:text-lg xl:text-xl leading-relaxed font-light">
              Join <span className="text-yellow-400 font-medium">LearnR</span> today. We blend modern teaching techniques with personalized attention to help you speak and write with absolute confidence.
            </p>
            
            {/* Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-5">
              <div className="rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300 w-full sm:w-auto">
                <Link href="/courses" className="w-full flex items-center justify-center px-8 py-3 sm:py-4 border border-transparent text-base font-bold rounded-full text-black bg-yellow-400 hover:bg-yellow-300 transition-all duration-300 transform hover:-translate-y-1">
                  Explore Courses
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="w-full sm:w-auto">
                {/* Changed href from "/about" to "#about" so it scrolls to the section instead of 404 */}
                <Link href="#about" className="w-full flex items-center justify-center px-8 py-3 sm:py-4 border-2 border-yellow-400/50 text-base font-bold rounded-full text-yellow-400 bg-transparent hover:bg-yellow-400/10 transition-all duration-300 transform hover:-translate-y-1">
                  How It Works
                </Link>
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE (CARD) --- */}
          <div className="mt-12 lg:mt-0 lg:col-span-6 relative flex items-center justify-center perspective-[2000px] transform scale-90 sm:scale-100 origin-center">
             <div className="relative w-full max-w-md mx-auto group">

                {/* Tera Mera Rings */}
                <div className="absolute -inset-8 md:-inset-24 border-2 border-dashed border-yellow-500/30 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute -inset-4 md:-inset-12 border border-dotted border-yellow-500/40 rounded-[40%_60%_70%_30%/50%_60%_30%_60%] animate-[spin_50s_linear_infinite_reverse]"></div>
                
                {/* Backdrop Cards */}
                <div className="absolute top-8 left-8 w-4/5 h-4/5 border border-white/5 bg-gray-900/40 backdrop-blur-xl rounded-3xl transform -rotate-6 z-10 shadow-2xl transition-transform duration-500 group-hover:-rotate-12"></div>
                <div className="absolute top-4 left-4 w-4/5 h-4/5 border border-yellow-500/20 bg-gray-800/40 backdrop-blur-xl rounded-3xl transform rotate-3 z-20 shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-transform duration-500 group-hover:rotate-6"></div>
                
                {/* MAIN CARD */}
                <div className="relative z-30 bg-black/80 backdrop-blur-2xl border border-yellow-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_30px_60px_rgba(234,179,8,0.25)]">
                   
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                   <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none"></div>

                   <div className="flex flex-col items-center text-center relative z-10">
                      
                      {/* Icon Section */}
                      <div className="relative mb-6 sm:mb-8">
                         <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.4)] transform rotate-12 group-hover:rotate-0 transition-all duration-500 relative z-10">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-black transform -rotate-12 group-hover:rotate-0 transition-all duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                           </svg>
                         </div>
                         <div className="absolute -top-4 -right-6 p-2 bg-gray-900/80 border border-yellow-500/40 rounded-xl backdrop-blur-md animate-[bounce_3s_infinite]">
                            <span className="text-yellow-400 font-bold text-base sm:text-lg">A+</span>
                         </div>
                         <div className="absolute -bottom-2 -left-6 p-2 bg-gray-900/80 border border-yellow-500/40 rounded-xl backdrop-blur-md animate-[bounce_4s_infinite] animation-delay-1000">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.972 7.972 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                             </svg>
                         </div>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-sm">Smart Speaking Coach</h3>
                      <p className="text-gray-300 mt-2 sm:mt-3 font-light text-base sm:text-lg">Real-time pronunciation & grammar feedback.</p>

                      <div className="mt-6 sm:mt-8 w-full bg-black/40 border border-yellow-500/20 rounded-xl p-3 sm:p-4 backdrop-blur-md relative overflow-hidden">
                          <div className="flex items-center justify-between mb-2 sm:mb-3 text-sm relative z-10">
                              <span className="text-gray-300 flex items-center font-medium">
                                <span className="relative flex h-2 w-2 mr-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Recording...
                              </span>
                              <span className="text-yellow-400 font-mono text-[10px] sm:text-xs tracking-wider">AI ANALYZING</span>
                          </div>
                          <div className="flex justify-between items-center h-6 sm:h-8 px-2 space-x-1">
                              <div className="w-1 bg-yellow-500/50 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3"></div>
                              <div className="w-1 bg-yellow-500/80 rounded-full animate-[pulse_1.0s_ease-in-out_infinite] h-6"></div>
                              <div className="w-1 bg-yellow-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-8"></div>
                              <div className="w-1 bg-yellow-500/80 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-5"></div>
                              <div className="w-1 bg-yellow-500/50 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-3"></div>
                              <div className="w-1 bg-yellow-500/30 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-2"></div>
                          </div>
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400 font-mono uppercase tracking-widest relative z-10">
                              <span>Accent Score</span>
                              <span className="text-yellow-400 font-bold text-xs">98% (Excellent)</span>
                          </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}