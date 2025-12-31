import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Hum SVG code ko direct string ki tarah store karenge
    iconSvg: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Feature || mongoose.model("Feature", FeatureSchema);