import FixHistory from "../models/FixHistory.js";
import mongoose from "mongoose";

// Save a generated AI fix
export const saveFixHistory = async (req, res) => {
   
  try {
    const {
      language,
      originalCode,
      suggestedCode,
      issue,
    } = req.body;

    if (
  !["python", "javascript"].includes(language) ||
  typeof originalCode !== "string" ||
  !originalCode.trim() ||
  typeof suggestedCode !== "string" ||
  !suggestedCode.trim() ||
  !issue ||
  typeof issue !== "object" ||
  Array.isArray(issue) ||
  Object.keys(issue).length === 0
) {
  return res.status(400).json({
    success: false,
    message: "Invalid or missing fix details",
  });
}

    const fix = await FixHistory.create({
      user: req.user.id,
      language,
      originalCode,
      suggestedCode,
      issue,
    });

    return res.status(201).json({
      success: true,
      message: "Fix history saved successfully",
      fix,
    });
  } catch (error) {
    console.error("Save fix history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save fix history",
    });
  }
};

// Get user's fix history
export const getFixHistory = async (req, res) => {
  try {
    const fixes = await FixHistory.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fixes.length,
      fixes,
    });
  } catch (error) {
    console.error("Get fix history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch fix history",
    });
  }
};

// Update fix status
export const updateFixStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid fix history ID",
  });
}
    if (!["applied", "discarded"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be applied or discarded",
      });
    }

    const fix = await FixHistory.findOneAndUpdate(
      {
        _id: id,
        user: req.user.id,
      },
      { status },
      { returnDocument: "after", runValidators: true }
    );

    if (!fix) {
      return res.status(404).json({
        success: false,
        message: "Fix history record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fix status updated successfully",
      fix,
    });
  } catch (error) {
    console.error("Update fix status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update fix status",
    });
  }
};