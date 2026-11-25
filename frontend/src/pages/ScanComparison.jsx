import { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
function ScanComparison() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [olderScanId, setOlderScanId] = useState("");
  const [newerScanId, setNewerScanId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await API.get("/scans/history");

        if (response.data.success) {
          setScans(response.data.scans || []);
        }
      } catch (error) {
        toast.error("Unable to load scan history");
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);
const scoreChartData = comparison
  ? [
      {
        name: "Older Scan",
        score: comparison.olderScan.securityScore,
      },
      {
        name: "Newer Scan",
        score: comparison.newerScan.securityScore,
      },
    ]
  : [];
  const handleCompare = async () => {
    if (!olderScanId || !newerScanId) {
      toast.error("Please select both scans");
      return;
    }

    if (olderScanId === newerScanId) {
      toast.error("Please select two different scans");
      return;
    }

    try {
      setComparing(true);
      setComparison(null);

      const response = await API.post("/scans/compare", {
        scanId1: olderScanId,
        scanId2: newerScanId,
      });

      if (response.data.success) {
        setComparison(response.data.comparison);
        toast.success("Scan comparison completed!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to compare scans");
    } finally {
      setComparing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link to="/dashboard" className="text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Scan Comparison</h1>

        <p className="mt-2 text-slate-400">
          Compare two scans to track security improvements.
        </p>

        {loading ? (
          <p className="mt-8 text-slate-400">Loading scan history...</p>
        ) : scans.length < 2 ? (
          <p className="mt-8 text-yellow-400">
            You need at least two scans to compare.
          </p>
        ) : (
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
            {/* Scan selectors will be added next */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Older Scan */}
              <div>
                <label className="mb-2 block font-semibold text-slate-300">
                  Select Older Scan
                </label>

                <select
                  value={olderScanId}
                  onChange={(e) => setOlderScanId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
                >
                  <option value="">Choose older scan</option>

                  {scans.map((scan) => (
                    <option key={scan._id} value={scan._id}>
                      {scan.language.toUpperCase()} |{" "}
                      {new Date(scan.createdAt).toLocaleString()} |{" "}
                      {scan.securityIssueCount} security issues
                    </option>
                  ))}
                </select>
              </div>

              {/* Newer Scan */}
              <div>
                <label className="mb-2 block font-semibold text-slate-300">
                  Select Newer Scan
                </label>

                <select
                  value={newerScanId}
                  onChange={(e) => setNewerScanId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
                >
                  <option value="">Choose newer scan</option>

                  {scans.map((scan) => (
                    <option key={scan._id} value={scan._id}>
                      {scan.language.toUpperCase()} |{" "}
                      {new Date(scan.createdAt).toLocaleString()} |{" "}
                      {scan.securityIssueCount} security issues
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={comparing || !olderScanId || !newerScanId}
              className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {comparing ? "Comparing Scans..." : "Compare Scans"}
            </button>

            {comparison && (
              <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold">Comparison Results</h2>

                {/* Security Scores */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                    <p className="text-slate-400">Older Security Score</p>
                    <h3 className="mt-2 text-4xl font-bold text-blue-400">
                      {comparison.olderScan.securityScore}/100
                    </h3>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                    <p className="text-slate-400">Newer Security Score</p>
                    <h3 className="mt-2 text-4xl font-bold text-emerald-400">
                      {comparison.newerScan.securityScore}/100
                    </h3>
                  </div>
                </div>
                {/* Security Score Comparison Chart */}
<div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
  <h3 className="mb-6 text-xl font-bold">
    Security Score Comparison
  </h3>

  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={scoreChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis dataKey="name" stroke="#cbd5e1" />
        <YAxis domain={[0, 100]} stroke="#cbd5e1" />
        <Tooltip />
        <Bar
          dataKey="score"
          fill="#8b5cf6"
          name="Security Score"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
                {/* Score Change */}
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                  <p className="text-slate-400">Security Score Change</p>

                  <h3
                    className={`mt-2 text-3xl font-bold ${
                      comparison.scoreChange > 0
                        ? "text-emerald-400"
                        : comparison.scoreChange < 0
                          ? "text-red-400"
                          : "text-slate-300"
                    }`}
                  >
                    {comparison.scoreChange > 0 ? "+" : ""}
                    {comparison.scoreChange} points
                  </h3>
                </div>

                {/* Issue Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-red-800 bg-slate-900 p-5">
                    <p className="text-slate-400">New Issues</p>
                    <h3 className="mt-2 text-3xl font-bold text-red-400">
                      {comparison.introducedCount}
                    </h3>
                  </div>

                  <div className="rounded-xl border border-green-800 bg-slate-900 p-5">
                    <p className="text-slate-400">Resolved Issues</p>
                    <h3 className="mt-2 text-3xl font-bold text-green-400">
                      {comparison.resolvedCount}
                    </h3>
                  </div>

                  <div className="rounded-xl border border-yellow-800 bg-slate-900 p-5">
                    <p className="text-slate-400">Remaining Issues</p>
                    <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                      {comparison.remainingCount}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Security Findings */}
            {/* Detailed Security Findings */}
            {comparison && (
              <div className="space-y-5">
                {/* Introduced Issues */}
                <div className="rounded-xl border border-red-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-bold text-red-400">
                    Newly Introduced Issues
                  </h3>

                  {comparison.introducedIssues.length === 0 ? (
                    <p className="text-slate-400">
                      No new security issues found.
                    </p>
                  ) : (
                    comparison.introducedIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="mb-3 rounded-lg bg-slate-800 p-4"
                      >
                        <p className="font-semibold">
                          {issue.rule_id ||
                            issue.type ||
                            issue.title ||
                            issue.name ||
                            "Security Issue"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {issue.message ||
                            issue.description ||
                            "No description available"}
                        </p>
                        <p className="mt-2 text-sm text-red-400">
                          Severity: {issue.severity || "Unknown"}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Resolved Issues */}
                <div className="rounded-xl border border-green-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-bold text-green-400">
                    Resolved Issues
                  </h3>

                  {comparison.resolvedIssues.length === 0 ? (
                    <p className="text-slate-400">No issues were resolved.</p>
                  ) : (
                    comparison.resolvedIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="mb-3 rounded-lg bg-slate-800 p-4"
                      >
                        <p className="font-semibold">
                          {issue.rule_id ||
                            issue.type ||
                            issue.title ||
                            issue.name ||
                            "Security Issue"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {issue.message ||
                            issue.description ||
                            "No description available"}
                        </p>
                        <p className="mt-2 text-sm text-green-400">
                          Severity: {issue.severity || "Unknown"}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Remaining Issues */}
                <div className="rounded-xl border border-yellow-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-bold text-yellow-400">
                    Remaining Issues
                  </h3>

                  {comparison.remainingIssues.length === 0 ? (
                    <p className="text-slate-400">
                      No remaining security issues.
                    </p>
                  ) : (
                    comparison.remainingIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="mb-3 rounded-lg bg-slate-800 p-4"
                      >
                        <p className="font-semibold">
                          {issue.rule_id ||
                            issue.type ||
                            issue.title ||
                            issue.name ||
                            "Security Issue"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {issue.message ||
                            issue.description ||
                            "No description available"}
                        </p>
                        <p className="mt-2 text-sm text-yellow-400">
                          Severity: {issue.severity || "Unknown"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanComparison;
