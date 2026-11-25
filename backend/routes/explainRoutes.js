import express from "express";

import { explainIssue } from "../controllers/explainController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected AI explanation endpoint
router.post("/", protect, explainIssue);

export default router;