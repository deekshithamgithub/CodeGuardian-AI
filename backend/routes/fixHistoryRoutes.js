import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  saveFixHistory,
  getFixHistory,
  updateFixStatus,
} from "../controllers/fixHistoryController.js";

const router = express.Router();

router.post("/", protect, saveFixHistory);
router.get("/", protect, getFixHistory);
router.patch("/:id", protect, updateFixStatus);
export default router;