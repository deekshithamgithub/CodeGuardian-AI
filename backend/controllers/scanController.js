
import axios from "axios";
import Scan from "../models/Scan.js";
import mongoose from "mongoose";
export const analyzeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!process.env.AI_SERVICE_URL) {
  return res.status(500).json({
    success: false,
    message: "AI service URL is not configured",
  });
}
    // Validate source code
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Source code is required",
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({
        success: false,
        message: "Code exceeds the 50000 character limit",
      });
    }

    // Validate supported languages
    const supportedLanguages = ["python", "javascript"];

    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language",
      });
    }

    // Send request to FastAPI
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze`,
      { code, language },
      { timeout: 360000 }
    );

    const analysisData = response.data;
    const results = analysisData.results;

    if (!analysisData.success || !results) {
      return res.status(502).json({
        success: false,
        message: "AI analysis returned an invalid response",
      });
    }

    // Extract findings
    const securityIssues = results.security_issues || [];
    const qualityIssues = results.quality_issues || [];

    const securityIssueCount = securityIssues.length;
    const qualityIssueCount = qualityIssues.length;

    const totalIssues =
      securityIssueCount + qualityIssueCount;

    // Save scan in MongoDB
    const savedScan = await Scan.create({
      user: req.user.id,
      language,
      code,
      results,
      totalIssues,
      securityIssueCount,
      qualityIssueCount,
    });

    return res.status(200).json({
      ...analysisData,
      scanId: savedScan._id,
      saved: true,
    });

  } catch (error) {
    console.error(
      "Code analysis error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "Code analysis or scan storage failed",
    });
  }
};



export const getScanHistory = async (req, res) => {
  try {
    const scans = await Scan.find({
      user: req.user.id,
    })
      .select("-code -results")
      .sort({ createdAt: -1 });

    // Calculate severity totals.
    const severityCounts = await Scan.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
        },
      },
      {
        $project: {
          issues: {
            $concatArrays: [
              { $ifNull: ["$results.security_issues", []] },
              { $ifNull: ["$results.quality_issues", []] },
            ],
          },
        },
      },
      { $unwind: "$issues" },
      {
        $group: {
          _id: {
            $toUpper: {
              $ifNull: ["$issues.severity", "UNKNOWN"],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const severitySummary = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      UNKNOWN: 0,
    };

    severityCounts.forEach((item) => {
      if (severitySummary[item._id] !== undefined) {
        severitySummary[item._id] = item.count;
      }
    });

    // Calculate the most frequently detected issue categories.
    const categoryCounts = await Scan.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
        },
      },
      {
        $project: {
          issues: {
            $concatArrays: [
              { $ifNull: ["$results.security_issues", []] },
              { $ifNull: ["$results.quality_issues", []] },
            ],
          },
        },
      },
      { $unwind: "$issues" },
      {
        $project: {
          category: {
            $toLower: {
              $ifNull: [
                "$issues.rule_id",
                {
                  $ifNull: [
                    "$issues.title",
                    {
                      $ifNull: [
                        "$issues.name",
                        {
                          $ifNull: [
                            "$issues.type",
                            "$issues.message",
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const issueCategorySummary = categoryCounts.map((item) => ({
      category: item._id || "Unknown",
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      count: scans.length,
      scans,
      severitySummary,
      issueCategorySummary,
    });
  } catch (error) {
    console.error("Scan history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve scan history",
    });
  }
};


export const getScanById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid scan ID",
  });
}
    const scan = await Scan.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    return res.status(200).json({
      success: true,
      scan,
    });
  } catch (error) {
    console.error("Get scan error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve scan details",
    });
  }
};
export const compareScans = async (req, res) => {
  try {
    const { scanId1, scanId2 } = req.body;
    if (!scanId1 || !scanId2) {
  return res.status(400).json({
    success: false,
    message: "Both scan IDs are required",
  });
}
    // Validate scan IDs
    if (
      !mongoose.Types.ObjectId.isValid(scanId1) ||
      !mongoose.Types.ObjectId.isValid(scanId2)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide two valid scan IDs",
      });
    }

    if (scanId1 === scanId2) {
      return res.status(400).json({
        success: false,
        message: "Please select two different scans",
      });
    }

    // Retrieve scans belonging to the logged-in user
    const [scan1, scan2] = await Promise.all([
      Scan.findOne({ _id: scanId1, user: req.user.id }),
      Scan.findOne({ _id: scanId2, user: req.user.id }),
    ]);

    if (!scan1 || !scan2) {
      return res.status(404).json({
        success: false,
        message: "One or both scans were not found",
      });
    }

    // Extract security findings
    const oldIssues = scan1.results.security_issues || [];
    const newIssues = scan2.results.security_issues || [];

    // Create a consistent identity for each finding
    const getIssueKey = (issue) =>
      [
        issue.rule_id || issue.type || issue.title || issue.name || issue.message,
        issue.tool || "",
        issue.file_path || issue.file || issue.filename || "",
        issue.line || issue.line_number || "",
      ].join("|");

    const oldMap = new Map(
      oldIssues.map((issue) => [getIssueKey(issue), issue])
    );

    const newMap = new Map(
      newIssues.map((issue) => [getIssueKey(issue), issue])
    );

    const introducedIssues = newIssues.filter(
      (issue) => !oldMap.has(getIssueKey(issue))
    );

    const resolvedIssues = oldIssues.filter(
      (issue) => !newMap.has(getIssueKey(issue))
    );

    const remainingIssues = newIssues.filter(
      (issue) => oldMap.has(getIssueKey(issue))
    );

    // Calculate security scores using the same severity penalties
    const calculateScore = (issues) => {
      const penalties = {
        CRITICAL: 25,
        HIGH: 15,
        MEDIUM: 8,
        LOW: 3,
      };

      const totalPenalty = issues.reduce((total, issue) => {
        const severity = String(issue.severity || "LOW").toUpperCase();
        return total + (penalties[severity] || 3);
      }, 0);

      return Math.max(0, 100 - totalPenalty);
    };

    const oldScore = calculateScore(oldIssues);
    const newScore = calculateScore(newIssues);

    return res.status(200).json({
      success: true,
      comparison: {
        olderScan: {
          id: scan1._id,
          date: scan1.createdAt,
          totalSecurityIssues: oldIssues.length,
          securityScore: oldScore,
        },
        newerScan: {
          id: scan2._id,
          date: scan2.createdAt,
          totalSecurityIssues: newIssues.length,
          securityScore: newScore,
        },
        introducedIssues,
        resolvedIssues,
        remainingIssues,
        introducedCount: introducedIssues.length,
        resolvedCount: resolvedIssues.length,
        remainingCount: remainingIssues.length,
        scoreChange: newScore - oldScore,
      },
    });
  } catch (error) {
    console.error("Scan comparison error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to compare scans",
    });
  }
};