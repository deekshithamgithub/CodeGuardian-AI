import { useState } from "react";
import API from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const GitHubScanner = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [repository, setRepository] = useState(null);
  const [branches, setBranches] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explainingIssue, setExplainingIssue] = useState(null);
  const [repositoryResult, setRepositoryResult] = useState(null);
  const [repositoryScanning, setRepositoryScanning] = useState(false);
  const [expandedFile, setExpandedFile] = useState(null);
  const navigate = useNavigate();
  const connectRepository = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/github/validate", {
        repoUrl,
      });

      if (response.data.success) {
        setRepository(response.data.repository);
        toast.success("Repository connected successfully!");
      }
    } catch (error) {
      console.error("GitHub connection error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to connect repository.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!repository) {
      toast.error("Connect a repository first");
      return;
    }

    try {
      setLoading(true);

      const [owner, repo] = repository.fullName.split("/");

      const response = await API.post("/github/branches", {
        owner,
        repo,
      });

      if (response.data.success) {
        setBranches(response.data.branches);

        setSelectedBranch(repository.defaultBranch);

        toast.success("Branches loaded successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!repository || !selectedBranch) {
      toast.error("Connect a repository and select a branch");
      return;
    }

    try {
      setLoading(true);

      const [owner, repo] = repository.fullName.split("/");

      const response = await API.post("/github/files", {
        owner,
        repo,
        branch: selectedBranch,
      });

      if (response.data.success) {
        setFiles(response.data.files);
        setSelectedFile("");

        toast.success(`${response.data.files.length} source files found`);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to fetch repository files",
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchSelectedFile = async () => {
    if (!repository || !selectedBranch || !selectedFile) {
      toast.error("Please select a source file first");
      return;
    }

    try {
      setLoading(true);

      const [owner, repo] = repository.fullName.split("/");

      const response = await API.post("/github/file-content", {
        owner,
        repo,
        branch: selectedBranch,
        filePath: selectedFile,
      });

      if (response.data.success) {
        const content =
          response.data.file?.content ??
          response.data.content ??
          response.data.data?.content;

        if (typeof content !== "string") {
          throw new Error("File content was not returned by the server");
        }

        setFileContent(content);
        toast.success("Source file loaded successfully!");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to fetch source file",
      );
    } finally {
      setLoading(false);
    }
  };

  const analyzeSelectedFile = async () => {
    if (!repository || !selectedBranch || !selectedFile) {
      toast.error("Please select a source file first");
      return;
    }

    try {
      setLoading(true);
      setAnalysisResult(null);

      const [owner, repo] = repository.fullName.split("/");

      const response = await API.post("/github/analyze", {
        owner,
        repo,
        branch: selectedBranch,
        filePath: selectedFile,
      });

      if (response.data.success && response.data.analysis?.results) {
        console.log("GitHub Analysis Response:", response.data);

        setAnalysisResult(response.data.analysis);

        toast.success("GitHub file analyzed successfully!");
      } else {
        toast.error("Analysis results were not returned");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to analyze GitHub file",
      );
    } finally {
      setLoading(false);
    }
  };

  const analyzeEntireRepository = async () => {
    if (!repository || !selectedBranch) {
      toast.error("Connect a repository and select a branch");
      return;
    }

    try {
      setRepositoryScanning(true);
      setRepositoryResult(null);

      const [owner, repo] = repository.fullName.split("/");

      const response = await API.post("/github/analyze-repository", {
        owner,
        repo,
        branch: selectedBranch,
      });

      if (response.data.success) {
        setRepositoryResult(response.data);
        toast.success("Repository scan completed!");
      } else {
        toast.error("Repository scan failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to scan repository");
    } finally {
      setRepositoryScanning(false);
    }
  };

  // const explainIssue = async (issue, index, category) => {
  //   const issueKey = `${category}-${index}`;

  //   try {
  //     setExplainingIssue(issueKey);

  //     const response = await API.post("/explanations", {
  //       code: fileContent,
  //       issue,
  //     });

  //     if (response.data.success) {
  //       setExplanations((previous) => ({
  //         ...previous,
  //         [issueKey]: response.data,
  //       }));

  //       toast.success("AI explanation generated!");
  //     } else {
  //       toast.error("Unable to generate explanation");
  //     }
  //   } catch (error) {
  //     toast.error(
  //       error.response?.data?.message || "Explanation generation failed",
  //     );
  //   } finally {
  //     setExplainingIssue(null);
  //   }
  // };

  const explainIssue = async (issue, index, category) => {
    const issueKey = `${category}-${index}`;

    try {
      setExplainingIssue(issueKey);

      const response = await API.post("/explanations", {
        code: fileContent,
        issue,
      });

      const data = response.data;

      // Extract the actual explanation string.
      const explanationText =
        typeof data?.explanation === "string"
          ? data.explanation
          : typeof data?.explanation?.explanation === "string"
            ? data.explanation.explanation
            : typeof data?.data?.explanation === "string"
              ? data.data.explanation
              : null;

      if (!explanationText) {
        throw new Error(
          data?.message ||
            data?.error ||
            "AI explanation was not returned correctly.",
        );
      }

      // Store only a string, never the complete response object.
      setExplanations((previous) => ({
        ...previous,
        [issueKey]: explanationText,
      }));

      toast.success("AI explanation generated!");
    } catch (error) {
      console.error(
        "GitHub AI explanation error:",
        error.response?.data || error,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Explanation generation failed.",
      );
    } finally {
      setExplainingIssue(null);
    }
  };

  const calculateSecurityScore = (result) => {
    if (!result || result.scannedFiles === 0) return null;

    const penalties = {
      CRITICAL: 25,
      HIGH: 15,
      MEDIUM: 8,
      LOW: 3,
    };

    const securityIssues = result.files
      .filter((file) => file.success)
      .flatMap((file) => file.analysis?.results?.security_issues || []);

    const totalPenalty = securityIssues.reduce((total, issue) => {
      const severity = String(issue.severity || "LOW").toUpperCase();
      return total + (penalties[severity] || 3);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  };
  const getSecurityRating = (score) => {
    if (score === null || score === undefined) return "Not Available";
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Needs Improvement";
    if (score >= 25) return "Poor";
    return "Critical";
  };
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-white">
          GitHub Repository Scanner
        </h1>

        <p className="mt-2 text-slate-400">
          Analyze source code directly from public GitHub repositories.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="border border-slate-700 bg-transparent text-blue-400 px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <label className="mb-2 block font-semibold">
            GitHub Repository URL
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
            />

            <button
              onClick={connectRepository}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect Repository"}
            </button>
          </div>

          {repository && (
            <div className="mt-6 rounded-lg border border-green-700 bg-green-950/30 p-4">
              <h2 className="text-lg font-bold text-green-400">
                {repository.fullName}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                {repository.description || "No description available"}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                Default branch: {repository.defaultBranch}
              </p>

              {/* Load Branches */}
              <button
                onClick={fetchBranches}
                disabled={loading}
                className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load Branches"}
              </button>

              {/* Branch Dropdown */}
              {branches.length > 0 && (
                <div className="mt-5">
                  <label className="mb-2 block font-semibold">
                    Select Branch
                  </label>

                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white"
                  >
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Load Source Files */}
              <button
                onClick={fetchFiles}
                disabled={loading || !selectedBranch}
                className="mt-4 rounded-lg bg-purple-600 px-5 py-2 font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load Source Files"}
              </button>

              {/* Source File Dropdown */}
              {files.length > 0 && (
                <div className="mt-6">
                  <label className="mb-2 block font-semibold">
                    Select Source File
                  </label>

                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white"
                  >
                    <option value="">Select a source file</option>

                    {files.map((file) => (
                      <option key={file.path} value={file.path}>
                        {file.path}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scan Entire Repository */}
              <button
                onClick={analyzeEntireRepository}
                disabled={
                  loading ||
                  repositoryScanning ||
                  !repository ||
                  !selectedBranch ||
                  files.length === 0
                }
                className="mt-5 w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {repositoryScanning
                  ? "Scanning Entire Repository..."
                  : "Scan Entire Repository"}
              </button>

              {selectedFile && (
                <button
                  onClick={fetchSelectedFile}
                  disabled={loading}
                  className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 font-semibold hover:bg-cyan-700 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load File Content"}
                </button>
              )}
              {fileContent && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-bold text-cyan-400">
                    Source Code: {selectedFile}
                  </h3>

                  <pre className="max-h-[500px] overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-green-300">
                    <code>{fileContent}</code>
                  </pre>
                  <button
                    onClick={analyzeSelectedFile}
                    disabled={loading}
                    className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Analyzing..." : "Analyze with CodeGuardian AI"}
                  </button>
                </div>
              )}

              {analysisResult && (
                <div className="mt-8 space-y-6">
                  <h2 className="text-2xl font-bold text-blue-400">
                    CodeGuardian Analysis Results
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Total Issues</p>
                      <h3 className="mt-2 text-3xl font-bold text-white">
                        {(analysisResult.results?.security_issues?.length ||
                          0) +
                          (analysisResult.results?.quality_issues?.length || 0)}
                      </h3>
                    </div>

                    <div className="rounded-lg border border-red-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Security Issues</p>
                      <h3 className="mt-2 text-3xl font-bold text-red-400">
                        {analysisResult.results?.security_issues?.length || 0}
                      </h3>
                    </div>

                    <div className="rounded-lg border border-yellow-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Quality Issues</p>
                      <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                        {analysisResult.results?.quality_issues?.length || 0}
                      </h3>
                    </div>
                  </div>

                  {[
                    {
                      title: "Security Findings",
                      issues: analysisResult.results?.security_issues || [],
                    },
                    {
                      title: "Code Quality Findings",
                      issues: analysisResult.results?.quality_issues || [],
                    },
                  ].map((section) => (
                    <div key={section.title}>
                      <h3 className="mb-4 text-xl font-bold text-white">
                        {section.title}
                      </h3>

                      {section.issues.length === 0 ? (
                        <p className="rounded-lg bg-slate-900 p-4 text-green-400">
                          No issues detected.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {section.issues.map((issue, index) => (
                            <div
                              key={`${issue.rule_id || issue.message}-${index}`}
                              className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <h4 className="font-bold text-white">
                                  {issue.message || "Issue detected"}
                                </h4>

                                <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-bold text-red-400">
                                  {issue.severity || "UNCLASSIFIED"}
                                </span>
                              </div>

                              <div className="mt-3 space-y-1 text-sm text-slate-400">
                                <p>Tool: {issue.tool || "Unknown"}</p>
                                <p>Rule: {issue.rule_id || "Not specified"}</p>
                                <p>Line: {issue.line ?? "Not specified"}</p>
                              </div>

                              {issue.description && (
                                <p className="mt-3 text-sm text-slate-300">
                                  {issue.description}
                                </p>
                              )}
                              <button
                                onClick={() =>
                                  explainIssue(issue, index, section.title)
                                }
                                disabled={explainingIssue !== null}
                                className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                              >
                                {explainingIssue === `${section.title}-${index}`
                                  ? "Generating Explanation..."
                                  : "Explain with AI"}
                              </button>

                              {/* {explanations[`${section.title}-${index}`] && (
                                <div className="mt-4 rounded-lg border border-purple-700 bg-purple-950/30 p-4">
                                  <h5 className="mb-2 font-bold text-purple-300">
                                    AI Explanation
                                  </h5>

                                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                                    {explanations[`${section.title}-${index}`]
                                      .explanation ||
                                      explanations[`${section.title}-${index}`]
                                        .message ||
                                      JSON.stringify(
                                        explanations[
                                          `${section.title}-${index}`
                                        ],
                                        null,
                                        2,
                                      )}
                                  </p>
                                </div>
                              )} */}

                              {typeof explanations[
                                `${section.title}-${index}`
                              ] === "string" && (
                                <div className="mt-4 rounded-lg border border-purple-700 bg-purple-950/30 p-4">
                                  <h5 className="mb-2 font-bold text-purple-300">
                                    AI Explanation
                                  </h5>

                                  <div className="whitespace-pre-wrap text-sm text-slate-200">
                                    {explanations[`${section.title}-${index}`]}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {analysisResult.scanId && (
                    <p className="text-sm text-green-400">
                      Scan saved successfully. Scan ID: {analysisResult.scanId}
                    </p>
                  )}
                </div>
              )}

              {/* Repository Scan Results */}
              {repositoryResult && (
                <div className="mt-8 space-y-6">
                  <h2 className="text-2xl font-bold text-emerald-400">
                    Repository Security Overview
                  </h2>

                  <p className="text-slate-400">
                    {repositoryResult.repository} / {repositoryResult.branch}
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Files Scanned</p>
                      <h3 className="mt-2 text-3xl font-bold">
                        {repositoryResult.scannedFiles}
                      </h3>
                    </div>

                    <div className="rounded-lg border border-red-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Security Issues</p>
                      <h3 className="mt-2 text-3xl font-bold text-red-400">
                        {repositoryResult.totalSecurityIssues}
                      </h3>
                    </div>

                    <div className="rounded-lg border border-yellow-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Quality Issues</p>
                      <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                        {repositoryResult.totalQualityIssues}
                      </h3>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
                    <p className="text-sm text-gray-400">Security Score</p>
                    <h3 className="mt-2 text-3xl font-bold text-emerald-400">
                      {calculateSecurityScore(repositoryResult) ?? "N/A"}
                      {repositoryResult?.scannedFiles > 0 ? "/100" : ""}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-blue-400">
                      {getSecurityRating(
                        calculateSecurityScore(repositoryResult),
                      )}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Based on security findings and severity
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                    <h3 className="mb-4 text-lg font-bold">
                      Severity Distribution
                    </h3>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {Object.entries(repositoryResult.severityCounts).map(
                        ([severity, count]) => (
                          <div
                            key={severity}
                            className="rounded-lg bg-slate-800 p-4"
                          >
                            <p className="text-sm text-slate-400">{severity}</p>
                            <p className="mt-2 text-2xl font-bold">{count}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                    <h3 className="mb-4 text-lg font-bold">
                      File Scan Results & Findings
                    </h3>

                    {repositoryResult.files.map((file) => {
                      const scan = file.analysis;
                      const results = scan?.results || {};

                      const securityIssues = results.security_issues || [];
                      const qualityIssues = results.quality_issues || [];

                      const isExpanded = expandedFile === file.filePath;

                      return (
                        <div
                          key={file.filePath}
                          className="mb-4 overflow-hidden rounded-lg border border-slate-700"
                        >
                          <button
                            onClick={() =>
                              setExpandedFile(isExpanded ? null : file.filePath)
                            }
                            className="flex w-full items-center justify-between gap-4 bg-slate-800 p-4 text-left hover:bg-slate-700"
                          >
                            <div>
                              <p className="font-semibold text-blue-400">
                                {file.filePath}
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                {file.success
                                  ? `${securityIssues.length} security issues | ${qualityIssues.length} quality issues`
                                  : file.message}
                              </p>
                            </div>

                            <span className="text-xl text-white">
                              {isExpanded ? "−" : "+"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="space-y-5 p-4">
                              {!file.success ? (
                                <p className="text-red-400">{file.message}</p>
                              ) : (
                                <>
                                  {[
                                    {
                                      title: "Security Findings",
                                      issues: securityIssues,
                                    },
                                    {
                                      title: "Code Quality Findings",
                                      issues: qualityIssues,
                                    },
                                  ].map((section) => (
                                    <div key={section.title}>
                                      <h4 className="mb-3 font-bold text-white">
                                        {section.title}
                                      </h4>

                                      {section.issues.length === 0 ? (
                                        <p className="text-sm text-green-400">
                                          No issues detected.
                                        </p>
                                      ) : (
                                        <div className="space-y-3">
                                          {section.issues.map(
                                            (issue, index) => (
                                              <div
                                                key={`${issue.rule_id || issue.message}-${index}`}
                                                className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                                              >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <p className="font-semibold text-white">
                                                    {issue.message ||
                                                      "Issue detected"}
                                                  </p>

                                                  <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-bold text-red-400">
                                                    {issue.severity ||
                                                      "UNCLASSIFIED"}
                                                  </span>
                                                </div>

                                                <div className="mt-3 space-y-1 text-sm text-slate-400">
                                                  <p>
                                                    Tool:{" "}
                                                    {issue.tool || "Unknown"}
                                                  </p>
                                                  <p>
                                                    Rule:{" "}
                                                    {issue.rule_id ||
                                                      "Not specified"}
                                                  </p>
                                                  <p>
                                                    Line:{" "}
                                                    {issue.line ??
                                                      "Not specified"}
                                                  </p>
                                                </div>

                                                {issue.description && (
                                                  <p className="mt-3 text-sm text-slate-300">
                                                    {issue.description}
                                                  </p>
                                                )}
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-sm text-slate-400">
                    Total issues: {repositoryResult.totalIssues}
                    {" | "}
                    Failed files: {repositoryResult.failedFiles}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default GitHubScanner;
