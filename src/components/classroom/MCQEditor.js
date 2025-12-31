"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { 
  ArrowLeft, Save, Plus, Trash2, MoreVertical, 
  Copy, Loader2, AlignLeft, Clock, Award, 
  AlertTriangle, BarChart3
} from "lucide-react";
import { toast } from "react-hot-toast";

// --- MEMOIZED SINGLE QUESTION COMPONENT ---
const QuestionItem = memo(({ q, index, updateQuestion, updateOption, deleteQuestion, duplicateQuestion }) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleDescription = () => {
    updateQuestion(index, 'showDescription', !q.showDescription);
    setShowMenu(false);
  };

  // Safe Delete Handler
  const handleDelete = () => {
     if(confirm(`Are you sure you want to delete Question ${index + 1}?`)) {
        deleteQuestion(index);
     }
  };

  return (
    <div className="group bg-[#111] border border-white/10 hover:border-cyan-500/30 focus-within:border-cyan-500 rounded-xl p-6 transition-all duration-300 shadow-lg relative animate-in fade-in slide-in-from-bottom-2">
       
       {/* Left Indicator Line */}
       <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
       
       {/* Drag Handle */}
       <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/10 group-hover:bg-white/20"></div>

       {/* Question Header */}
       <div className="flex gap-4 mb-4">
          <span className="mt-3 text-sm font-bold text-gray-500 bg-white/5 w-8 h-8 flex items-center justify-center rounded-lg select-none">
            {index + 1}
          </span>
          <div className="flex-1 space-y-3">
             <textarea 
               value={q.questionText}
               onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
               placeholder="Question"
               className="w-full bg-[#0a0a0a] border-b-2 border-white/10 focus:border-cyan-500 outline-none text-lg p-3 rounded-t-lg transition-colors resize-none field-sizing-content min-h-[60px]"
             />
             
             {q.showDescription && (
                <input 
                  value={q.description || ""}
                  onChange={(e) => updateQuestion(index, 'description', e.target.value)}
                  placeholder="Description (Optional)"
                  className="w-full text-sm text-gray-400 bg-transparent border-b border-white/10 focus:border-cyan-500 outline-none pb-2 animate-in fade-in"
                />
             )}
          </div>
       </div>

       {/* Options Grid */}
       <div className="space-y-3 pl-12 mb-6">
          {q.options.map((opt, oIndex) => (
            <div key={oIndex} className="flex items-center gap-3 group/option">
               <div 
                 onClick={() => updateQuestion(index, 'correctOption', oIndex)}
                 className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${q.correctOption === oIndex ? 'border-cyan-500 bg-cyan-500/20' : 'border-gray-600 hover:border-cyan-400'}`}
               >
                  {q.correctOption === oIndex && <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>}
               </div>

               <input 
                 value={opt}
                 onChange={(e) => updateOption(index, oIndex, e.target.value)}
                 placeholder={`Option ${oIndex + 1}`}
                 className={`flex-1 bg-transparent border-b border-white/10 focus:border-cyan-500 outline-none py-1.5 text-sm transition-colors ${q.correctOption === oIndex ? 'text-cyan-400 font-medium' : 'text-gray-300'}`}
               />
            </div>
          ))}
       </div>

       {/* Footer Actions */}
       <div className="pt-4 border-t border-white/5 flex justify-end items-center gap-4 relative">
           
           <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
              <span className="text-xs text-gray-500 font-bold">POINTS</span>
              <input 
                type="number" 
                min="0"
                value={q.marks}
                onChange={(e) => updateQuestion(index, 'marks', e.target.value)}
                className="w-14 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-center text-sm focus:border-cyan-500 outline-none text-white"
              />
           </div>
           
           <button onClick={() => duplicateQuestion(index)} className="text-gray-500 hover:text-white transition-colors" title="Duplicate"><Copy size={18}/></button>
           <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={18}/></button>
           
           <div className="relative ml-2">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
              </button>
              
              {showMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#151515] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={toggleDescription} 
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                      >
                         <AlignLeft size={16} /> 
                         {q.showDescription ? "Hide Description" : "Show Description"}
                      </button>
                  </div>
              )}
              {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>}
           </div>

       </div>
    </div>
  );
});
QuestionItem.displayName = "QuestionItem";

// --- MAIN EDITOR ---
export default function MCQEditor({ testId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [testDetails, setTestDetails] = useState({
    title: "", description: "", duration: 0, totalMarks: 0
  });
  
  const [questions, setQuestions] = useState([]);

  // Stats Logic
  const usedMarks = questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
  const marksPercentage = testDetails.totalMarks > 0 ? (usedMarks / testDetails.totalMarks) * 100 : 0;
  const isOverLimit = usedMarks > testDetails.totalMarks;

  // FETCH DATA
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/admin/tests/${testId}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        
        setTestDetails({
            title: data.title,
            description: data.description || "",
            duration: data.duration,
            totalMarks: data.totalMarks
        });
        
        // Load questions properly
        const formattedQs = (data.questions || []).map(q => ({
            ...q, 
            _id: q._id || `q_${Date.now()}_${Math.random()}`, // Assign ID only if missing
            showDescription: !!q.description 
        }));
        setQuestions(formattedQs);

      } catch (error) {
        toast.error("Error loading test");
        onBack();
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId, onBack]);

  // HANDLERS
  const addQuestion = useCallback(() => {
    if (usedMarks >= testDetails.totalMarks && testDetails.totalMarks > 0) {
        toast.error(`Limit Reached! Total marks (${testDetails.totalMarks}) already filled.`);
        return;
    }
    const newQ = {
      _id: `new_${Date.now()}`, // Temporary ID
      questionText: "",
      description: "",
      showDescription: false,
      options: ["", "", "", ""],
      correctOption: 0,
      marks: 1
    };
    setQuestions(prev => [...prev, newQ]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  }, [usedMarks, testDetails.totalMarks]);

  const updateQuestion = useCallback((index, field, value) => {
    if (field === 'marks') {
        const diff = Number(value) - Number(questions[index].marks);
        if (usedMarks + diff > testDetails.totalMarks && testDetails.totalMarks > 0) {
            toast.error("Cannot exceed Total Marks limit!");
            return;
        }
    }
    setQuestions(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
    });
  }, [questions, usedMarks, testDetails.totalMarks]);

  const updateOption = useCallback((qIndex, oIndex, value) => {
    setQuestions(prev => {
        const updated = [...prev];
        const newOptions = [...updated[qIndex].options];
        newOptions[oIndex] = value;
        updated[qIndex] = { ...updated[qIndex], options: newOptions };
        return updated;
    });
  }, []);

  const deleteQuestion = useCallback((index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const duplicateQuestion = useCallback((index) => {
    if (usedMarks >= testDetails.totalMarks && testDetails.totalMarks > 0) {
        toast.error("Cannot duplicate: Marks limit reached!");
        return;
    }
    setQuestions(prev => {
        const qToClone = prev[index];
        const newQ = { ...qToClone, _id: `dup_${Date.now()}` };
        const updated = [...prev];
        updated.splice(index + 1, 0, newQ);
        return updated;
    });
  }, [usedMarks, testDetails.totalMarks]);

  // --- SAVE HANDLER (THE FIX IS HERE) ---
  const handleSave = async () => {
    setSaving(true);
    try {
      if (!testDetails.title.trim()) throw new Error("Exam Title is required");

      // CLEANUP: Remove temporary IDs before sending to backend
      const cleanedQuestions = questions.map(q => {
          const { _id, showDescription, ...rest } = q;
          
          // Check if ID is a temporary string (contains underscore 'new_', 'dup_')
          // MongoDB ObjectIds are 24 chars hex. Our temp IDs are like 'new_172...'
          const isTempId = typeof _id === 'string' && (_id.includes('_') || _id.length < 24);
          
          // If temp ID, don't send it. MongoDB will create a new valid ObjectId.
          // If valid ID, keep it to update existing question.
          return isTempId ? rest : { ...rest, _id };
      });

      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ...testDetails, 
            questions: cleanedQuestions 
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      // Refresh data to get real IDs back
      const savedData = await res.json();
      
      // Update local state with saved data (now with real IDs)
      setTestDetails({
         title: savedData.title,
         description: savedData.description || "",
         duration: savedData.duration,
         totalMarks: savedData.totalMarks
      });
      const newFormattedQs = (savedData.questions || []).map(q => ({
          ...q, showDescription: !!q.description
      }));
      setQuestions(newFormattedQs);

      toast.success("Exam Saved Successfully!");

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Delete Exam
  const handleDeleteTest = async () => {
    if(!confirm("Are you sure you want to DELETE this entire exam? This action cannot be undone.")) return;
    setDeleting(true);
    try {
        const res = await fetch(`/api/admin/tests/${testId}`, { method: "DELETE" });
        if(res.ok) {
            toast.success("Exam deleted successfully");
            onBack();
        } else {
            throw new Error("Failed to delete");
        }
    } catch(err) {
        toast.error("Could not delete exam");
    } finally {
        setDeleting(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-40 animate-in fade-in duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 py-3 px-4 md:px-8 flex justify-between items-center shadow-md">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="font-bold text-sm md:text-lg text-white line-clamp-1">{testDetails.title || "Untitled Exam"}</h1>
                <p className="text-[10px] text-gray-500 hidden md:block">
                    {questions.length} Questions • {testDetails.totalMarks} Marks
                </p>
            </div>
         </div>

         <div className="flex items-center gap-3">
             <button 
               onClick={handleDeleteTest}
               disabled={deleting || saving}
               className="p-2 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-500 transition-colors mr-2"
               title="Delete Entire Exam"
             >
                {deleting ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
             </button>

             <span className="text-xs text-gray-500 font-mono hidden md:inline border-r border-white/10 pr-3 mr-1">
                {saving ? "Saving..." : "Unsaved changes"}
             </span>
             
             <button 
               onClick={handleSave}
               disabled={saving || deleting}
               className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:shadow-none"
             >
                {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                <span>Save Paper</span>
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
         
         {/* HEADER CARD + STATS */}
         <div className="bg-[#111] border-t-8 border-cyan-500 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-cyan-400 transition-colors">
            
            <div className="relative z-10 space-y-4 mb-8">
                <input 
                  value={testDetails.title}
                  onChange={(e) => setTestDetails({...testDetails, title: e.target.value})}
                  className="w-full text-3xl md:text-4xl font-black text-white bg-transparent border-b border-transparent focus:border-cyan-500 outline-none placeholder-gray-600 transition-all"
                  placeholder="Exam Title"
                />
                <textarea 
                  value={testDetails.description}
                  onChange={(e) => setTestDetails({...testDetails, description: e.target.value})}
                  className="w-full text-gray-400 bg-transparent border-b border-transparent focus:border-white/20 outline-none resize-none field-sizing-content min-h-[40px]"
                  placeholder="Form description (optional)"
                />
                
                <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
                        <Clock size={16} className="text-cyan-500"/>
                        <span className="text-xs font-bold text-gray-500">MINS:</span>
                        <input 
                          type="number"
                          value={testDetails.duration}
                          onChange={(e) => setTestDetails({...testDetails, duration: e.target.value})}
                          className="w-12 bg-transparent text-white text-sm font-bold outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
                        <Award size={16} className="text-cyan-500"/>
                        <span className="text-xs font-bold text-gray-500">TOTAL MARKS:</span>
                        <input 
                          type="number"
                          value={testDetails.totalMarks}
                          onChange={(e) => setTestDetails({...testDetails, totalMarks: Number(e.target.value)})}
                          className="w-12 bg-transparent text-white text-sm font-bold outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* NEON STATS GRAPH */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-cyan-400" />
                        <span className="text-sm font-bold text-gray-300">Marks Distribution</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl font-black ${isOverLimit ? 'text-red-500' : 'text-cyan-400'}`}>
                            {usedMarks}
                        </span>
                        <span className="text-gray-500 text-sm font-medium"> / {testDetails.totalMarks}</span>
                    </div>
                </div>

                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
                    <div 
                        className={`h-full transition-all duration-700 ease-out rounded-full relative ${isOverLimit ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]'}`}
                        style={{ width: `${Math.min(marksPercentage, 100)}%` }}
                    >
                         <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>

                <div className="flex justify-between mt-3 text-xs font-mono text-gray-500">
                    <span>{questions.length} Questions Added</span>
                    {usedMarks < testDetails.totalMarks ? (
                        <span className="text-cyan-500/70">{testDetails.totalMarks - usedMarks} Marks Remaining</span>
                    ) : (
                        <span className="text-red-400 font-bold">
                             {usedMarks === testDetails.totalMarks ? "Limit Reached" : "Limit Exceeded!"}
                        </span>
                    )}
                </div>
            </div>

         </div>

         {/* QUESTIONS */}
         <div className="space-y-4">
             {questions.map((q, index) => (
                <QuestionItem 
                   key={q._id} 
                   q={q} 
                   index={index}
                   updateQuestion={updateQuestion}
                   updateOption={updateOption}
                   deleteQuestion={deleteQuestion}
                   duplicateQuestion={duplicateQuestion}
                />
             ))}
         </div>

         {/* ADD BUTTON */}
         <div 
           onClick={addQuestion}
           className={`group border-2 border-dashed rounded-xl p-4 flex items-center justify-center transition-all ${
               usedMarks >= testDetails.totalMarks 
               ? 'border-red-500/20 cursor-not-allowed opacity-60 bg-red-900/5' 
               : 'border-white/10 hover:border-cyan-500/50 cursor-pointer hover:bg-cyan-500/5 active:scale-[0.99]'
           }`}
         >
            <div className={`flex flex-col items-center gap-2 ${usedMarks >= testDetails.totalMarks ? 'text-red-500/50' : 'text-gray-500 group-hover:text-cyan-400'}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${usedMarks >= testDetails.totalMarks ? 'bg-red-900/10' : 'bg-white/5 group-hover:scale-110'}`}>
                  {usedMarks >= testDetails.totalMarks ? <AlertTriangle size={20}/> : <Plus size={24}/>}
               </div>
               <span className="font-bold text-sm">
                   {usedMarks >= testDetails.totalMarks ? "Marks Limit Reached" : "Add New Question"}
               </span>
            </div>
         </div>

      </div>
    </div>
  );
}