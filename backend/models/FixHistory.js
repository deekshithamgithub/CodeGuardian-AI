import mongoose from "mongoose";

const fixHistorySchema = new mongoose.Schema(
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

    originalCode: {
  type: String,
  required: true,
  maxlength: 50000,
},

suggestedCode: {
  type: String,
  required: true,
  maxlength: 50000,
},

    issue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["generated", "applied", "discarded"],
      default: "generated",
    },
  },
  { timestamps: true }
);
fixHistorySchema.index({ user: 1, createdAt: -1 });
const FixHistory = mongoose.model("FixHistory", fixHistorySchema);

export default FixHistory;