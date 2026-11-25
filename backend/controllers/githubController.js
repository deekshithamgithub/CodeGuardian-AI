
import {
  getRepositoryInfo,
  getRepositoryBranches,
  getRepositoryFiles,
  getRepositoryFileContent,
} from "../services/githubService.js";
import axios from "axios";
export const validateRepository = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "GitHub repository URL is required.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(repoUrl.trim());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid GitHub URL.",
      });
    }

    if (
  parsedUrl.hostname !== "github.com" ||
  parsedUrl.protocol !== "https:" ||
  parsedUrl.port ||
  parsedUrl.username ||
  parsedUrl.password ||
  parsedUrl.search ||
  parsedUrl.hash
) {
  return res.status(400).json({
    success: false,
    message: "Only valid HTTPS GitHub repository URLs are supported.",
  });
}

    const parts = parsedUrl.pathname
      .split("/")
      .filter(Boolean);

    if (
      parts.length !== 2 ||
      parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part))
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a URL in the format https://github.com/owner/repository.",
      });
    }

    const [owner, repo] = parts;

    const repository = await getRepositoryInfo(owner, repo);

    if (repository.private) {
      return res.status(403).json({
        success: false,
        message: "Only public repositories are supported.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "GitHub repository connected successfully.",
      repository,
    });
  } catch (error) {
    console.error("GitHub repository validation error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to validate GitHub repository.",
    });
  }
};

export const fetchRepositoryBranches = async (req, res) => {
  try {
    const { owner, repo } = req.body;

    if (
      !owner ||
      !repo ||
      typeof owner !== "string" ||
      typeof repo !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Repository owner and name are required.",
      });
    }

    const branches = await getRepositoryBranches(
      owner.trim(),
      repo.trim()
    );

    return res.status(200).json({
      success: true,
      count: branches.length,
      branches,
    });
  } catch (error) {
    console.error("GitHub branches error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to fetch repository branches.",
    });
  }
};

export const fetchRepositoryFiles = async (req, res) => {
  try {
    const { owner, repo, branch } = req.body;

    if (
      !owner ||
      !repo ||
      !branch ||
      typeof owner !== "string" ||
      typeof repo !== "string" ||
      typeof branch !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner, repository and branch are required.",
      });
    }

    const result = await getRepositoryFiles(
      owner.trim(),
      repo.trim(),
      branch.trim()
    );

    return res.status(200).json({
      success: true,
      count: result.files.length,
      files: result.files,
      truncated: result.truncated,
    });
  } catch (error) {
    console.error("GitHub files error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to fetch repository files.",
    });
  }
};

export const fetchRepositoryFileContent = async (req, res) => {
  try {
    const { owner, repo, branch, filePath } = req.body;

    if (
      !owner ||
      !repo ||
      !branch ||
      !filePath ||
      typeof owner !== "string" ||
      typeof repo !== "string" ||
      typeof branch !== "string" ||
      typeof filePath !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner, repository, branch and file path are required.",
      });
    }

    const result = await getRepositoryFileContent(
      owner.trim(),
      repo.trim(),
      branch.trim(),
      filePath.trim()
    );

    return res.status(200).json({
      success: true,
      file: result,
    });
  } catch (error) {
    console.error("GitHub file content error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to fetch source code.",
    });
  }
};


export const analyzeGitHubFile = async (req, res) => {
  try {
    const { owner, repo, branch, filePath } = req.body;

    if (
      !owner ||
      !repo ||
      !branch ||
      !filePath ||
      typeof owner !== "string" ||
      typeof repo !== "string" ||
      typeof branch !== "string" ||
      typeof filePath !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner, repository, branch and file path are required.",
      });
    }

    const extension = filePath.split(".").pop().toLowerCase();

    const languageMap = {
      py: "python",
      js: "javascript",
      jsx: "javascript",
    };

    const language = languageMap[extension];

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Only Python, JavaScript and JSX files are supported.",
      });
    }

    // Download the selected GitHub source file.
    const file = await getRepositoryFileContent(
      owner.trim(),
      repo.trim(),
      branch.trim(),
      filePath.trim()
    );
if (!process.env.API_BASE_URL && process.env.NODE_ENV === "production") {
  return res.status(500).json({
    success: false,
    message: "Backend API URL is not configured.",
  });
}
    // Reuse the existing CodeGuardian scan API.
    const response = await axios.post(
      `${process.env.API_BASE_URL || "http://localhost:5000"}/api/scans`,
      {
        code: file.content,
        language,
      },
      {
        headers: {
          Authorization: req.headers.authorization,
        },
        timeout: 360000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "GitHub file analyzed successfully.",
      repository: `${owner}/${repo}`,
      branch,
      filePath: file.path,
      analysis: response.data,
    });
  } catch (error) {
    console.error(
      "GitHub analysis error:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 502).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "GitHub file analysis failed.",
    });
  }
};

export const analyzeGitHubRepository = async (req, res) => {
  try {
    const { owner, repo, branch } = req.body;

if (
  !owner ||
  !repo ||
  !branch ||
  typeof owner !== "string" ||
  typeof repo !== "string" ||
  typeof branch !== "string"
) {
  return res.status(400).json({
    success: false,
    message: "Valid repository owner, name and branch are required.",
  });
}

    // Get all supported source files.
    const { files, truncated } = await getRepositoryFiles(
      owner.trim(),
      repo.trim(),
      branch.trim()
    );

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "No supported source files found.",
      });
    }

    const results = [];

    // Analyze files one by one.
    for (const file of files) {
      try {
        const extension = file.path.split(".").pop().toLowerCase();

        const language =
          extension === "py" ? "python" : "javascript";

        const source = await getRepositoryFileContent(
          owner.trim(),
          repo.trim(),
          branch.trim(),
          file.path
        );

        const response = await axios.post(
          `${process.env.API_BASE_URL || "http://localhost:5000"}/api/scans`,
          {
            code: source.content,
            language,
          },
          {
            headers: {
              Authorization: req.headers.authorization,
            },
            timeout: 360000,
          }
        );

        results.push({
          filePath: file.path,
          language,
          success: true,
          analysis: response.data,
        });
      } catch (fileError) {
        console.error(
          `Failed to scan ${file.path}:`,
          fileError.response?.data || fileError.message
        );

        results.push({
          filePath: file.path,
          success: false,
          message: "Unable to analyze this file.",
        });
      }
    }

    // Calculate repository statistics.
    const successfulScans = results.filter(
      (item) => item.success
    );

    const securityIssues = successfulScans.flatMap(
      (item) =>
        item.analysis.results?.security_issues || []
    );

    const qualityIssues = successfulScans.flatMap(
      (item) =>
        item.analysis.results?.quality_issues || []
    );

    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    [...securityIssues, ...qualityIssues].forEach((issue) => {
      const severity = String(issue.severity || "LOW").toUpperCase();

      if (severityCounts[severity] !== undefined) {
        severityCounts[severity]++;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Repository scan completed.",
      repository: `${owner}/${repo}`,
      branch,
      totalFiles: files.length,
      scannedFiles: successfulScans.length,
      failedFiles: files.length - successfulScans.length,
      truncated,
      totalSecurityIssues: securityIssues.length,
      totalQualityIssues: qualityIssues.length,
      totalIssues:
        securityIssues.length + qualityIssues.length,
      severityCounts,
      files: results,
    });
  } catch (error) {
    console.error("Repository scan error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Repository scan failed.",
    });
  }
};
