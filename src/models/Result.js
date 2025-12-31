import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // Analytics ke liye optional
  
  // FIXED: Changed from Object Array to Number Array
  // [1, 0, 3, -1] -> Index matches Question Index
  answers: { type: [Number], default: [] }, 
  
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  
  timeTaken: { type: Number, default: 0 }, // Seconds me
  
  status: { type: String, enum: ['completed', 'auto-submitted'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

// Unique Constraint: Ek student ek test ek hi baar de sakta hai
ResultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.Result || mongoose.model("Result", ResultSchema);