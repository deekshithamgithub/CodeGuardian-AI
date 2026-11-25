import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import ScanDetails from "./pages/ScanDetails";
import GitHubScanner from "./pages/GitHubScanner";
import ScanComparison from "./pages/ScanComparison";
import FixHistory from "./pages/FixHistory";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-scan" element={<NewScan />} />
          <Route path="/scans/:id" element={<ScanDetails />} />

          <Route path="/github-scanner" element={<GitHubScanner />} />
          <Route path="/scan-comparison" element={<ScanComparison />} />
          <Route
  path="/fix-history"
  element={<FixHistory />}
/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
