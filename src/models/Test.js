import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String }], // Array of 4 options
  correctOption: { type: Number }, // Index 0-3
  marks: { type: Number, default: 1 },
  description: { type: String }
});

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  
  type: { type: String, enum: ['mcq', 'subjective'], default: 'mcq' },
  
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  totalMarks: { type: Number, default: 100 },
  
  isManualStart: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'live', 'completed'], 
    default: 'scheduled' 
  },

  questions: [QuestionSchema],
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Test || mongoose.model("Test", TestSchema);