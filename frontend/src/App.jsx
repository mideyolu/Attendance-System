import { Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import AttendanceDashboard from "./components/AttendanceDashboard";
import Dashboard from "./components/Dashboard/Dashboard";
import EnrollDashboard from "./components/Dashboard/EnrollDashboard";
import LiveRecognition from "./components/LiveRecognition";

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 6000,
          style: {
            background: "#10b981",
            color: "#fff",
            fontWeight: "600",
            padding: "16px",
            borderRadius: "8px",
          },
          success: {
            iconTheme: {
              primary: "#fff",
              secondary: "#10b981",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard/enrollment" element={<EnrollDashboard />} />
        <Route path="/dashboard/attendance" element={<AttendanceDashboard />} />
        <Route path="/live" element={<LiveRecognition />} />
      </Routes>
    </>
  );
}
