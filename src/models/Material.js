import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: "Syllabus", required: true }, // Chapter se link
    title: { type: String, required: true },
    type: { type: String, enum: ["PDF", "Link", "Image"], default: "PDF" },
    fileUrl: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Material || mongoose.model("Material", MaterialSchema);