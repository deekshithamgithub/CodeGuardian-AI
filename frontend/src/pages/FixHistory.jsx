import { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { DiffEditor } from "@monaco-editor/react";

function FixHistory() {
  const [fixes, setFixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const fetchFixes = async () => {
      try {
        const response = await API.get("/fix-history");

        if (response.data.success) {
          setFixes(response.data.fixes || []);
        }
      } catch (error) {
        console.error("Fetch fix history error:", error);
        toast.error("Unable to load fix history");
      } finally {
        setLoading(false);
      }
    };

    fetchFixes();
  }, []);
  const totalFixes = fixes.length;

  const generatedCount = fixes.filter(
    (fix) => fix.status === "generated",
  ).length;

  const appliedCount = fixes.filter((fix) => fix.status === "applied").length;

  const discardedCount = fixes.filter(
    (fix) => fix.status === "discarded",
  ).length;
  const filteredFixes = fixes.filter((fix) => {
    const matchesStatus = filter === "all" || fix.status === filter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      fix.language?.toLowerCase().includes(searchText) ||
      fix.issue?.rule_id?.toLowerCase().includes(searchText) ||
      fix.issue?.type?.toLowerCase().includes(searchText) ||
      fix.issue?.title?.toLowerCase().includes(searchText) ||
      fix.issue?.severity?.toLowerCase().includes(searchText);

    return matchesStatus && matchesSearch;
  });
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link to="/dashboard" className="text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">AI Fix History</h1>

        <p className="mt-2 text-slate-400">
          Review your previously generated AI code fixes.
        </p>

        {/* Fix History Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Fixes</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{totalFixes}</h3>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Generated</p>
            <h3 className="mt-2 text-3xl font-bold text-yellow-400">
              {generatedCount}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Applied</p>
            <h3 className="mt-2 text-3xl font-bold text-green-400">
              {appliedCount}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Discarded</p>
            <h3 className="mt-2 text-3xl font-bold text-red-400">
              {discardedCount}
            </h3>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {["all", "generated", "applied", "discarded"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-5 py-2 font-medium capitalize transition ${
                filter === status
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {status === "all" ? "All Fixes" : status}
            </button>
          ))}
        </div>
        {/* Search Fix History */}
        <div className="mt-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by language, issue, rule ID, or severity..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-purple-500"
          />
        </div>

        {/* Fix History List */}
        <div className="mt-8 space-y-5">
          {loading ? (
            <p className="text-slate-400">Loading fix history...</p>
          ) : filteredFixes.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
              <p className="text-slate-400">No fix history found.</p>
            </div>
          ) : (
            filteredFixes.map((fix) => (
              <div
                key={fix._id}
                className="rounded-xl border border-slate-700 bg-slate-900 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold capitalize">
                    {fix.language} Code Fix
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                      fix.status === "applied"
                        ? "bg-green-900 text-green-300"
                        : fix.status === "discarded"
                          ? "bg-red-900 text-red-300"
                          : "bg-yellow-900 text-yellow-300"
                    }`}
                  >
                    {fix.status}
                  </span>
                </div>

                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4">
                  <h4 className="mb-3 font-semibold text-purple-400">
                    Issue Details
                  </h4>

                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Rule ID:</span>{" "}
                    {fix.issue?.rule_id || "Not available"}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    <span className="text-slate-500">Description:</span>{" "}
                    {fix.issue?.message || "No description available"}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    <span className="text-slate-500">Severity:</span>{" "}
                    <span
                      className={
                        fix.issue?.severity?.toUpperCase() === "HIGH"
                          ? "font-semibold text-red-400"
                          : fix.issue?.severity?.toUpperCase() === "MEDIUM"
                            ? "font-semibold text-yellow-400"
                            : "font-semibold text-green-400"
                      }
                    >
                      {fix.issue?.severity || "Unknown"}
                    </span>
                  </p>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Generated: {new Date(fix.createdAt).toLocaleString()}
                </p>

                {/* Monaco Code Comparison */}
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between bg-slate-800 px-4 py-3">
                    <h4 className="font-semibold text-white">
                      Code Comparison
                    </h4>
                    <span className="text-xs text-slate-400">
                      Original vs Suggested
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-900 px-4 py-3">
                    <span className="text-sm font-semibold text-red-400">
                      Original Code
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                      Suggested Code
                    </span>
                  </div>

                  <div className="h-[350px]">
                    <DiffEditor
                      height="350px"
                      language={
                        fix.language === "python" ? "python" : "javascript"
                      }
                      original={fix.originalCode || ""}
                      modified={fix.suggestedCode || ""}
                      keepCurrentOriginalModel={true}
                      keepCurrentModifiedModel={true}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        renderSideBySide: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FixHistory;
