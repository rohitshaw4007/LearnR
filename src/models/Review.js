import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String, // e.g. "Class 12 Student" or "Competitive Aspirant"
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);