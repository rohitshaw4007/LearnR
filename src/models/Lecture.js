import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Lecture title is required"],
  },
  // Ye fields hona zaruri hai tabhi data save hoga
  chapter: {
    type: String,
    required: [true, "Chapter is required"],
  },
  bookName: {
    type: String, 
    default: "General",
  },
  description: {
    type: String,
  },
  videoUrl: {
    type: String, 
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  resourceUrl: {
    type: String,
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);