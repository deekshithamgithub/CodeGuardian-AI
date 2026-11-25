
import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    language: {
      type: String,
      enum: ["python", "javascript"],
      required: true,
    },

    code: {
      type: String,
      required: true,
      maxlength: 50000,
    },

    results: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

   totalIssues: {
  type: Number,
  default: 0,
  min: 0,
},

    securityIssueCount: {
      type: Number,
      default: 0,
    },

    qualityIssueCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
scanSchema.index({ user: 1, createdAt: -1 });
const Scan = mongoose.model("Scan", scanSchema);

export default Scan;
