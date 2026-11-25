import express from "express";
import { generateFix } from "../controllers/fixController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, generateFix);

export default router;