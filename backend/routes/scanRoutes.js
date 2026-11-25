
import express from "express";

import {
  analyzeCode,
  getScanHistory,
  getScanById,
  compareScans,
} from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, analyzeCode);

router.get("/history", protect, getScanHistory);

router.post("/compare", protect, compareScans);
router.get("/:id", protect, getScanById);
export default router;
