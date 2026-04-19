import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, 
  
  answers: { type: [Number], default: [] }, 
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  
  timeTaken: { type: Number, default: 0 }, 
  
  // 🛠️ BUG FIX: 'in-progress' ko enum me define kiya gaya hai
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'auto-submitted'], 
    default: 'in-progress' 
  },
  
  startedAt: { type: Date, default: Date.now }, 
  createdAt: { type: Date, default: Date.now }
});

// Unique Constraint
ResultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

// 🛠️ NEXT.JS CACHE FIX: Agar purana model load hai toh usko hatao taaki naya enum apply ho
if (mongoose.models.Result) {
  delete mongoose.models.Result;
}

export default mongoose.model("Result", ResultSchema);