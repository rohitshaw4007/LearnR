import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String }], 
  correctOption: { type: Number }, 
  marks: { type: Number, default: 1 },
  description: { type: String }
});

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  type: { type: String, enum: ['mcq', 'subjective'], default: 'mcq' },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, required: true }, 
  
  validityHours: { type: Number, default: 24 }, // NEW FIELD
  
  totalMarks: { type: Number, default: 100 },
  isManualStart: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'scheduled', 'live', 'completed'], default: 'scheduled' },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now }
});

// 🚨 FIX FOR MONGOOSE CACHING IN NEXT.JS 🚨
if (mongoose.models.Test) {
  delete mongoose.models.Test;
}

export default mongoose.model("Test", TestSchema);