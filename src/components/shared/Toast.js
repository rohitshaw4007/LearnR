"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Toast add karne ka function
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // 3 second baad auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  // Manual remove function
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              layout
              className={`pointer-events-auto min-w-[300px] backdrop-blur-xl border p-4 rounded-xl shadow-2xl flex items-center gap-4 relative overflow-hidden ${
                toast.type === "success" 
                  ? "bg-green-900/40 border-green-500/30 text-green-200" 
                  : "bg-red-900/40 border-red-500/30 text-red-200"
              }`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-full ${toast.type === "success" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                {toast.type === "success" ? (
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              {/* Message */}
              <div className="flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-0.5">
                  {toast.type === "success" ? "Success" : "Error"}
                </h4>
                <p className="text-sm font-medium opacity-90">{toast.message}</p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Progress Bar (Animation) */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};