import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severitySummary, setSeveritySummary] = useState({
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  });
  const [issueCategorySummary, setIssueCategorySummary] = useState([]);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        const response = await API.get("/scans/history");

        if (response.data.success) {
          setScans(response.data.scans);
          setSeveritySummary(response.data.severitySummary);
          setIssueCategorySummary(response.data.issueCategorySummary || []);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Unable to load scan history.");
      } finally {
        setLoading(false);
      }
    };

    fetchScanHistory();
  }, []);

  const totalScans = scans.length;
  // Group scans by date
  const scanActivityData = Object.values(
    scans.reduce((activity, scan) => {
      const date = new Date(scan.createdAt).toLocaleDateString();

      if (!activity[date]) {
        activity[date] = {
          date,
          totalScans: 0,
        };
      }

      activity[date].totalScans++;

      return activity;
    }, {}),
  ).sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalSecurityIssues = scans.reduce(
    (total, scan) => total + scan.securityIssueCount,
    0,
  );

  const totalQualityIssues = scans.reduce(
    (total, scan) => total + scan.qualityIssueCount,
    0,
  );
  // Security vs. quality comparison
  const issueComparisonData = [
    {
      category: "Issues",
      Security: totalSecurityIssues,
      Quality: totalQualityIssues,
    },
  ];

  // Severity distribution
  const severityChartData = [
    { severity: "Critical", count: severitySummary.CRITICAL },
    { severity: "High", count: severitySummary.HIGH },
    { severity: "Medium", count: severitySummary.MEDIUM },
    { severity: "Low", count: severitySummary.LOW },
  ];

  const severityColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const severityCounts = scans.reduce(
    (counts, scan) => {
      const allIssues = [
        ...(scan.results?.security_issues || []),
        ...(scan.results?.quality_issues || []),
      ];

      allIssues.forEach((issue) => {
        const severity = issue.severity?.toUpperCase();

        if (severity && counts[severity] !== undefined) {
          counts[severity]++;
        }
      });

      return counts;
    },
    {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
  );
  // Get the latest scan
  const latestScan = scans.reduce((latest, scan) => {
    if (!latest || new Date(scan.createdAt) > new Date(latest.createdAt)) {
      return scan;
    }
    return latest;
  }, null);

  // Calculate score based on severity
  const calculateScore = (issues = []) => {
    const deductions = {
      CRITICAL: 20,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 2,
    };

    const totalDeduction = issues.reduce((total, issue) => {
      const severity = (issue.severity || issue.type || "").toUpperCase();

      return total + (deductions[severity] || 0);
    }, 0);

    return Math.max(0, 100 - totalDeduction);
  };

  const securityScore = latestScan
    ? calculateScore(latestScan.results?.security_issues || [])
    : null;

  const qualityScore = latestScan
    ? calculateScore(latestScan.results?.quality_issues || [])
    : null;
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-slate-800 p-5">
        <div>
          <h1 style={{ color: "#60a5fa" }} className="text-3xl font-extrabold">
            CodeGuardian AI
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Intelligent Code Quality & Security Auditor
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-5 py-2 hover:bg-red-700"
        >
          Logout
        </button>
      </nav>

      <main className="p-8">
        <h2 style={{ color: "#ffffff" }} className="text-3xl font-bold">
          Welcome, {user?.name}!
        </h2>

        <p className="mt-3 text-slate-400">
          Your intelligent code quality and security auditor.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/new-scan"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Start New Scan
          </Link>

          <Link
            to="/scan-comparison"
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Compare Scans
          </Link>

          <Link
            to="/fix-history"
            className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700"
          >
            AI Fix History
          </Link>

          <Link
            to="/github-scanner"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            GitHub Scanner
          </Link>
        </div>
        <h2 style={{ color: "#ffffff" }} className="mt-10 text-2xl font-bold">
          Dashboard Analytics
        </h2>

        {loading ? (
          <p className="mt-5 text-slate-400">Loading dashboard...</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <p className="text-slate-400">Total Scans</p>
                <h3 className="mt-2 text-3xl font-bold text-blue-400">
                  {totalScans}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <p className="text-slate-400">Security Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-red-400">
                  {totalSecurityIssues}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <p className="text-slate-400">Quality Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                  {totalQualityIssues}
                </h3>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-red-800 bg-slate-900 p-6">
                <p className="text-slate-400">Critical Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-red-500">
                  {severitySummary.CRITICAL}
                </h3>
              </div>

              <div className="rounded-xl border border-red-700 bg-slate-900 p-6">
                <p className="text-slate-400">High Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-red-400">
                  {severitySummary.HIGH}
                </h3>
              </div>

              <div className="rounded-xl border border-yellow-700 bg-slate-900 p-6">
                <p className="text-slate-400">Medium Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                  {severitySummary.MEDIUM}
                </h3>
              </div>

              <div className="rounded-xl border border-green-700 bg-slate-900 p-6">
                <p className="text-slate-400">Low Issues</p>
                <h3 className="mt-2 text-3xl font-bold text-green-400">
                  {severitySummary.LOW}
                </h3>
              </div>
            </div>
            {/* Security and Code Quality Scores */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-blue-700 bg-slate-900 p-6">
                <p className="text-slate-400">Security Score</p>

                <h3 className="mt-3 text-4xl font-bold text-blue-400">
                  {securityScore !== null ? `${securityScore}/100` : "N/A"}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Based on the latest scan
                </p>
              </div>

              <div className="rounded-xl border border-green-700 bg-slate-900 p-6">
                <p className="text-slate-400">Code Quality Score</p>

                <h3 className="mt-3 text-4xl font-bold text-green-400">
                  {qualityScore !== null ? `${qualityScore}/100` : "N/A"}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Based on the latest scan
                </p>
              </div>
            </div>
            {/* Dashboard Charts */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Security vs Quality Chart */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="mb-5 text-lg font-semibold">
                  Security vs Quality Issues
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={issueComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    <XAxis dataKey="category" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="Security"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Quality"
                      fill="#eab308"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Severity Distribution Chart */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="mb-5 text-lg font-semibold">
                  Severity Distribution
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell
                          key={entry.severity}
                          fill={severityColors[index]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Scan Activity Chart */}
            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="mb-5 text-lg font-semibold">
                Scan Activity Over Time
              </h3>

              {scanActivityData.length === 0 ? (
                <p className="py-10 text-center text-slate-400">
                  No scan activity available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scanActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="totalScans"
                      name="Total Scans"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Most Frequently Detected Issues */}
            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="mb-5 text-lg font-semibold">
                Most Frequently Detected Issues
              </h3>

              {issueCategorySummary.length === 0 ? (
                <p className="py-10 text-center text-slate-400">
                  No issue categories available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={issueCategorySummary}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      allowDecimals={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#94a3b8"
                      width={160}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Occurrences"
                      fill="#8b5cf6"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <h2 className="mt-12 text-2xl font-bold">Recent Scan History</h2>

            {scans.length === 0 ? (
              <p className="mt-5 text-slate-400">
                No scans available. Start your first scan!
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="p-4">Language</th>
                      <th className="p-4">Total Issues</th>
                      <th className="p-4">Security</th>
                      <th className="p-4">Quality</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {scans.map((scan) => (
                      <tr key={scan._id} className="border-t border-slate-800">
                        <td className="p-4 capitalize">{scan.language}</td>
                        <td className="p-4">{scan.totalIssues}</td>
                        <td className="p-4 text-red-400">
                          {scan.securityIssueCount}
                        </td>
                        <td className="p-4 text-yellow-400">
                          {scan.qualityIssueCount}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(scan.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Link
                            to={`/scans/${scan._id}`}
                            className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
