import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    level: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    students: { type: Number, default: 0 },
    category: { type: String, required: true },
    gradient: { type: String, required: true },
    
    // --- IMPORTANCE: Yeh field honi chahiye ---
    liveRoom: {
      isLive: { type: Boolean, default: false },
      youtubeId: { type: String, default: "" },
      topic: { type: String, default: "" },
      startedAt: { type: Date }
    },
    // ------------------------------------------

    isLocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);