import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function ScanDetails() {
  const { id } = useParams();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScanDetails = async () => {
      try {
        const response = await API.get(`/scans/${id}`);

        if (response.data.success) {
          setScan(response.data.scan);
        }
      } catch (error) {
        console.error("Scan details error:", error);
        toast.error(
          error.response?.data?.message || "Unable to load scan details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScanDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading scan details...</div>;
  }

  if (!scan) {
    return (
      <div className="p-8 text-center">
        <p>Scan not found.</p>
        <Link to="/dashboard" className="text-blue-600 underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const securityIssues = scan.results?.security_issues || [];
  const qualityIssues = scan.results?.quality_issues || [];
  const getSeverityStyle = (severity) => {
    const styles = {
      CRITICAL: "bg-red-700 text-white",
      HIGH: "bg-red-100 text-red-700",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      LOW: "bg-green-100 text-green-700",
    };

    return styles[severity?.toUpperCase()] || "bg-gray-100 text-gray-700";
  };

  const downloadPDF = () => {
  if (!scan) {
    toast.error("Scan details are not available");
    return;
  }

  const doc = new jsPDF();

  const securityIssues = scan.results?.security_issues || [];
  const qualityIssues = scan.results?.quality_issues || [];

  // Report title
  doc.setFontSize(20);
  doc.text("CodeGuardian AI", 14, 20);

  doc.setFontSize(14);
  doc.text("Code Analysis Report", 14, 30);

  // Scan information
  doc.setFontSize(10);
  doc.text(`Scan ID: ${scan._id}`, 14, 42);
  doc.text(`Language: ${scan.language}`, 14, 49);
  doc.text(
    `Date: ${new Date(scan.createdAt).toLocaleString()}`,
    14,
    56
  );

  doc.text(`Total Issues: ${scan.totalIssues}`, 14, 63);
  doc.text(`Security Issues: ${scan.securityIssueCount}`, 14, 70);
  doc.text(`Quality Issues: ${scan.qualityIssueCount}`, 14, 77);

  let currentY = 88;

  // Security findings
  doc.setFontSize(13);
  doc.text("Security Findings", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Severity", "Issue", "Line", "Tool"]],
    body: securityIssues.map((issue) => [
  issue.severity || "Unclassified",
  issue.message || issue.description || "No description",
  issue.line || issue.line_number || "N/A",
  issue.tool || "N/A",
]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [180, 40, 40] },
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // Quality findings
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(13);
  doc.text("Quality Findings", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Severity", "Issue", "Line", "Tool"]],
    body: qualityIssues.map((issue) => [
  issue.severity || "Unclassified",
  issue.message || issue.description || "No description",
  issue.line || issue.line_number || "N/A",
  issue.tool || "N/A",
]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [40, 90, 160] },
  });

  // Download
  doc.save(`CodeGuardian-Report-${scan._id}.pdf`);

  toast.success("PDF report downloaded successfully!");
};
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
  <h1 className="text-3xl font-bold text-gray-800">
    Scan Details
  </h1>

  <button
    onClick={downloadPDF}
    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
  >
    Download PDF Report
  </button>
</div>
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <p>
            <strong>Language:</strong> {scan.language}
          </p>
          <p>
            <strong>Date:</strong> {new Date(scan.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Total Issues:</strong> {scan.totalIssues}
          </p>
          <p>
            <strong>Security Issues:</strong> {scan.securityIssueCount}
          </p>
          <p>
            <strong>Quality Issues:</strong> {scan.qualityIssueCount}
          </p>
        </div>

        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Security Issues
        </h2>

        {securityIssues.length === 0 ? (
          <p className="mb-6 rounded-lg bg-white p-4 text-green-700">
            No security issues found.
          </p>
        ) : (
          <div className="mb-8 space-y-4">
            {securityIssues.map((issue, index) => (
              <div key={index} className="rounded-lg bg-white p-5 shadow">
                <h3 className="font-semibold text-red-600">
                  {issue.title ||
                    issue.rule_id ||
                    issue.name ||
                    `Issue ${index + 1}`}
                </h3>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${getSeverityStyle(issue.severity)}`}
                >
                  {issue.severity || "UNCLASSIFIED"}
                </span>
                <p className="mt-2 text-gray-700">
                  {issue.message ||
                    issue.description ||
                    "No description available"}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Line: {issue.line || issue.line_number || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Code Quality Issues
        </h2>

        {qualityIssues.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-green-700">
            No code quality issues found.
          </p>
        ) : (
          <div className="space-y-4">
            {qualityIssues.map((issue, index) => (
              <div key={index} className="rounded-lg bg-white p-5 shadow">
                <h3 className="font-semibold text-orange-600">
                  {issue.title ||
                    issue.message ||
                    issue.code ||
                    `Issue ${index + 1}`}
                </h3>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${getSeverityStyle(issue.severity)}`}
                >
                  {issue.severity || "UNCLASSIFIED"}
                </span>
                <p className="mt-2 text-gray-700">
                  {issue.message ||
                    issue.description ||
                    "No description available"}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Line: {issue.line || issue.line_number || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanDetails;
