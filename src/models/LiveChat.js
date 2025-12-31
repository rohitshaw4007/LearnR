import mongoose from "mongoose";

const liveChatSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['admin', 'student'], default: 'student' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.LiveChat || mongoose.model("LiveChat", liveChatSchema);