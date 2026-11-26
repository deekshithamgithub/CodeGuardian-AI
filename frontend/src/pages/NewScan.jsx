import { useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import API, { generateCodeFix } from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";
const sampleCode = {
  python: `password = "admin123"

def login():
    print("Login successful")`,

  javascript: `const password = "admin123";

function login() {
    console.log("Login successful");
}`,
};
function NewScan() {
  const [language, setLanguage] = useState("python");

  const [code, setCode] = useState(
    'password = "admin123"\n\n' +
      "def login():\n" +
      '    print("Login successful")\n',
  );

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [explainingIssue, setExplainingIssue] = useState(null);
  const [fixingIssue, setFixingIssue] = useState(null);
  const [pendingFix, setPendingFix] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [pendingFixHistoryId, setPendingFixHistoryId] = useState(null);
  const handleScan = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to scan.");
      return;
    }
    setComparison(null);
    setLoading(true);
    setResults(null);

    try {
      const response = await API.post("/scans", {
        code,
        language,
      });

      setResults(response.data.results);
      toast.success("Code analysis completed!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to analyze code.");
    } finally {
      setLoading(false);
    }
  };

  

const handleExplain = async (issue, category, index) => {
  const issueKey = `${category}-${index}`;
  setExplainingIssue(issueKey);

  try {
    const response = await API.post("/explanations", {
      code,
      issue,
    });

    console.log("FULL EXPLANATION RESPONSE:", response.data);

    const data = response.data;

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
        data?.error ||
        data?.message ||
        data?.explanation?.error ||
        "Backend did not return a valid explanation."
      );
    }

    setResults((previous) => ({
      ...previous,
      [`${category}_issues`]: previous[`${category}_issues`].map(
        (item, i) =>
          i === index
            ? { ...item, ai_explanation: explanationText }
            : item
      ),
    }));

    toast.success("AI explanation generated!");
  } catch (error) {
    console.error("Explain AI error:", error);
    toast.error(error.message || "Unable to generate AI explanation.");
  } finally {
    setExplainingIssue(null);
  }
};


  const handleGenerateFix = async (issue, category, index) => {
  if (fixingIssue !== null) return;

  const issueKey = `${category}-${index}`;

  setFixingIssue(issueKey);
  setPendingFixHistoryId(null);

  try {
    const response = await generateCodeFix(code, issue);

    if (!response.success || !response.corrected_code) {
      throw new Error("AI could not generate a valid code fix.");
    }

    if (typeof response.corrected_code !== "string") {
      throw new Error("AI returned an invalid code format.");
    }

    // Save the generated fix in MongoDB
    try {
      const historyResponse = await API.post("/fix-history", {
        language,
        originalCode: code,
        suggestedCode: response.corrected_code,
        issue,
      });

      setPendingFixHistoryId(historyResponse.data.fix._id);

    } catch (historyError) {
      console.error(
        "Unable to save fix history:",
        historyError.response?.data || historyError.message
      );

      toast.error("Fix generated, but history could not be saved.");
    }

    // Show generated fix for review
    setPendingFix({
      original: code,
      modified: response.corrected_code,
      issue,
    });

    toast.success("AI code fix generated!");

  } catch (error) {
    console.error("Generate fix error:", error);

    toast.error(
      error.response?.data?.message ||
      error.message ||
      "Unable to generate code fix."
    );

  } finally {
    setFixingIssue(null);
  }
};

  const handleApplyFix = async () => {
    if (!pendingFix) return;

    const updatedCode = pendingFix.modified;
    const previousResults = results;

    setCode(updatedCode);
    setPendingFix(null);
    setResults(null);
    setComparison(null);
    setReanalyzing(true);

    try {
      const response = await API.post("/scans", {
        code: updatedCode,
        language,
      });

      if (response.data.success) {
        const updatedResults = response.data.results;

        setResults(updatedResults);

        setComparison({
          before: previousResults,
          after: updatedResults,
        });
        if (pendingFixHistoryId) {
          try {
            await API.patch(`/fix-history/${pendingFixHistoryId}`, {
              status: "applied",
            });
            setPendingFixHistoryId(null);
          } catch (historyError) {
            console.error("Unable to update fix history:", historyError);
            toast.error(
              "Code applied, but fix history status could not be updated.",
            );
          }
        }
        toast.success("Fix applied and code re-analyzed!");
      } else {
        toast.error("Re-analysis could not be completed.");
      }
    } catch (error) {
      console.error("Re-analysis error:", error);

      toast.error(
        error.response?.data?.message || "Fix applied, but re-analysis failed.",
      );
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDiscardFix = async () => {
  if (pendingFixHistoryId) {
    try {
      await API.patch(`/fix-history/${pendingFixHistoryId}`, {
        status: "discarded",
      });

      setPendingFixHistoryId(null);
    } catch (historyError) {
      console.error("Unable to update fix history:", historyError);
      toast.error("Fix discarded, but history status could not be updated.");
    }
  }

  setPendingFix(null);
  toast("Suggested fix discarded.");
};

  const getComparisonData = () => {
    if (!comparison) return null;

    const getFindings = (data) => [
      ...(data?.security_issues || []).map((issue) => ({
        ...issue,
        category: "Security",
      })),
      ...(data?.quality_issues || []).map((issue) => ({
        ...issue,
        category: "Quality",
      })),
    ];

    const getKey = (issue) =>
      [
        issue.category,
        issue.tool || (issue.detected_by || []).join(","),
        (issue.message || "").trim().toLowerCase(),
      ].join("|");

    const before = getFindings(comparison.before);
    const after = getFindings(comparison.after);

    const beforeKeys = new Set(before.map(getKey));
    const afterKeys = new Set(after.map(getKey));

    const resolved = before.filter((issue) => !afterKeys.has(getKey(issue)));

    const remaining = after.filter((issue) => beforeKeys.has(getKey(issue)));

    const newIssues = after.filter((issue) => !beforeKeys.has(getKey(issue)));

    return {
      beforeCount: before.length,
      afterCount: after.length,
      resolved,
      remaining,
      newIssues,
    };
  };

  const getSeverityStyle = (severity) => {
    const value = (severity || "").toUpperCase();

    if (["ERROR", "HIGH", "CRITICAL"].includes(value)) {
      return "text-red-400 bg-red-500/10";
    }

    if (["MEDIUM", "WARNING"].includes(value)) {
      return "text-yellow-400 bg-yellow-500/10";
    }

    if (["LOW"].includes(value)) {
      return "text-orange-400 bg-orange-500/10";
    }

    return "text-blue-400 bg-blue-500/10";
  };

  
const renderIssues = (issues, category) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-400">
        No {category.toLowerCase()} found.
      </div>
    );
  }

  return issues.map((issue, index) => {
    const tools = issue.detected_by?.length
      ? issue.detected_by.join(", ")
      : issue.tool || "Unknown";

    const severity = issue.severity || issue.type || "Finding";

    const explanationText =
      typeof issue.ai_explanation === "string"
        ? issue.ai_explanation
        : issue.ai_explanation?.explanation ||
          issue.ai_explanation?.error ||
          "";

    return (
      <div
        key={`${category}-${issue.tool}-${issue.line}-${index}`}
        className="rounded-xl border border-slate-700 bg-slate-900 p-5"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <h3 className="font-semibold text-white">
            {issue.message}
          </h3>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getSeverityStyle(severity)}`}
          >
            {severity}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
          <span>Detected by: {tools}</span>
          <span>Line: {issue.line ?? "N/A"}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleExplain(issue, category.toLowerCase(), index)
            }
            disabled={
              explainingIssue !== null || !!issue.ai_explanation
            }
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {explainingIssue === `${category.toLowerCase()}-${index}`
              ? "Generating explanation..."
              : issue.ai_explanation
                ? "Explanation Generated"
                : "Explain with AI"}
          </button>

          <button
            onClick={() =>
              handleGenerateFix(issue, category.toLowerCase(), index)
            }
            disabled={fixingIssue !== null}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {fixingIssue === `${category.toLowerCase()}-${index}`
              ? "Generating Fix..."
              : "Generate Fix"}
          </button>
        </div>

        {issue.ai_explanation && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h4 className="font-semibold text-blue-400">
              AI Explanation
            </h4>

            {explanationText ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">
                {explanationText}
              </p>
            ) : (
              <p className="mt-2 text-sm text-red-400">
                Explanation could not be displayed. Please try again.
              </p>
            )}
          </div>
        )}
      </div>
    );
  });
};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-7xl">
       <h1 className="mb-4 text-3xl font-bold text-blue-500">
  New Code Scan
</h1>
        <Link
          to="/dashboard"
          className="mb-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-blue-400 hover:bg-slate-800"
        >
          ← Back to Dashboard
        </Link>
        <p className="mt-2 text-slate-400">
          Analyze your code for bugs, quality issues, and security
          vulnerabilities.
        </p>

        <div className="mt-8 flex items-center justify-between">
          <select
            value={language}
            onChange={(e) => {
  const selectedLanguage = e.target.value;

  setLanguage(selectedLanguage);
  setCode(sampleCode[selectedLanguage]);
  setResults(null);
  setComparison(null);
  setPendingFix(null);
}}
            className="rounded-lg border border-slate-700
                       bg-slate-900 px-4 py-3"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>

          <button
            onClick={handleScan}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3
                       font-semibold hover:bg-blue-700
                       disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Scan Code"}
          </button>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-xl
                        border border-slate-700"
        >
          <Editor
            height="450px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        {pendingFix && (
          <div
            className="mt-10 rounded-xl border border-slate-700
                  bg-slate-900 p-5"
          >
            <h2 className="text-xl font-bold text-green-400">
              AI Suggested Code Fix
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Review the differences before applying the suggested fix.
            </p>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-700">
              <DiffEditor
                height="450px"
                language={language}
                theme="vs-dark"
                original={pendingFix.original}
                modified={pendingFix.modified}
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleApplyFix}
                className="rounded-lg bg-green-600 px-5 py-3
                   font-semibold hover:bg-green-700"
              >
                Apply Fix
              </button>

              <button
                onClick={handleDiscardFix}
                className="rounded-lg bg-slate-700 px-5 py-3
                   font-semibold hover:bg-slate-600"
              >
                Discard Fix
              </button>
            </div>
          </div>
        )}
        {loading && (
          <p className="mt-5 text-blue-400">
            Running static code and security analysis. Please wait...
          </p>
        )}

        {results && (
          <div className="mt-10 space-y-8">
            {comparison &&
              (() => {
                const data = getComparisonData();

                if (!data) return null;

                const cards = [
                  {
                    title: "Issues Before Fix",
                    value: data.beforeCount,
                    color: "text-blue-400",
                  },
                  {
                    title: "Issues After Fix",
                    value: data.afterCount,
                    color: "text-purple-400",
                  },
                  {
                    title: "Issues Resolved",
                    value: data.resolved.length,
                    color: "text-green-400",
                  },
                  {
                    title: "Issues Remaining",
                    value: data.remaining.length,
                    color: "text-yellow-400",
                  },
                  {
                    title: "New Issues",
                    value: data.newIssues.length,
                    color: "text-red-400",
                  },
                ];

                return (
                  <div className="space-y-5">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Before & After Fix Comparison
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cards.map((card) => (
                        <div
                          key={card.title}
                          className="rounded-xl border border-slate-700
                       bg-slate-900 p-5"
                        >
                          <p className="text-sm text-slate-400">{card.title}</p>

                          <p
                            className={`mt-2 text-3xl font-bold ${card.color}`}
                          >
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div
                      className="rounded-xl border border-slate-700
                      bg-slate-900 p-5 space-y-4"
                    >
                      <div>
                        <h3 className="font-semibold text-green-400">
                          Resolved Findings
                        </h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {data.resolved.length === 0
                            ? "No findings were resolved."
                            : data.resolved
                                .map((issue) => issue.message)
                                .join("; ")}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-yellow-400">
                          Remaining Findings
                        </h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {data.remaining.length === 0
                            ? "No previously detected findings remain."
                            : data.remaining
                                .map((issue) => issue.message)
                                .join("; ")}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-red-400">
                          New Findings
                        </h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {data.newIssues.length === 0
                            ? "No new findings detected."
                            : data.newIssues
                                .map((issue) => issue.message)
                                .join("; ")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            <h2 className="text-2xl font-bold">Scan Results</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="rounded-xl border border-slate-700
                              bg-slate-900 p-5"
              >
                <p className="text-slate-400">Quality Issues</p>

                <p className="mt-2 text-3xl font-bold text-blue-400">
                  {results.quality_issues?.length || 0}
                </p>
              </div>

              <div
                className="rounded-xl border border-slate-700
                              bg-slate-900 p-5"
              >
                <p className="text-slate-400">Security Issues</p>

                <p className="mt-2 text-3xl font-bold text-red-400">
                  {results.security_issues?.length || 0}
                </p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-red-400">
                Security Findings
              </h3>

              {renderIssues(results.security_issues, "Security")}
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-400">
                Code Quality Findings
              </h3>

              {renderIssues(results.quality_issues, "Quality")}
            </section>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default NewScan;
