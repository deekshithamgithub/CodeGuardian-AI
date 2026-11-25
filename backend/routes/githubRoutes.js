
import express from "express";
import {
  validateRepository,
  fetchRepositoryBranches,
  fetchRepositoryFiles,
  fetchRepositoryFileContent,
  analyzeGitHubFile,
  analyzeGitHubRepository,
} from "../controllers/githubController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateRepository);
router.post("/branches", protect, fetchRepositoryBranches);
router.post("/files", protect, fetchRepositoryFiles);
router.post("/file-content", protect, fetchRepositoryFileContent);
router.post("/analyze", protect, analyzeGitHubFile);
router.post("/analyze-repository", protect, analyzeGitHubRepository);
export default router;
