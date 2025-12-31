// src/models/Notice.js
import mongoose from "mongoose";

const NoticeSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Yeh field decide karegi ki notice kab delete hoga
    expireAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB TTL Index: expireAt time par document automatically delete ho jayega
NoticeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Notice || mongoose.model("Notice", NoticeSchema);