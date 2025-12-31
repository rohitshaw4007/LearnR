import mongoose from "mongoose";

const SyllabusSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    chapterNo: { type: Number, required: true },
    chapterName: { type: String, required: true },
    bookName: { type: String, required: true }, // Smart dropdown ke liye use hoga
    topicName: { type: String, required: true }, // Smart dropdown ke liye use hoga
    status: { 
      type: String, 
      enum: ["Pending", "Ongoing", "Completed"], 
      default: "Pending" 
    },
    completedDate: { type: Date }, // Jab status completed hoga tab set hoga
  },
  { timestamps: true }
);

export default mongoose.models.Syllabus || mongoose.model("Syllabus", SyllabusSchema);