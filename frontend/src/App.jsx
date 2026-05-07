import { Route, Routes } from "react-router";
import AttendanceDashboard from "./components/AttendanceDashboard";
import Dashboard from "./components/Dashboard/Dashboard";
import EnrollDashboard from "./components/Dashboard/EnrollDashboard";
import LiveRecognition from "./components/LiveRecognition";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard/enrollment" element={<EnrollDashboard />} />
            <Route
                path="/dashboard/attendance"
                element={<AttendanceDashboard />}
            />

            <Route path="/live" element={<LiveRecognition />} />
        </Routes>
    );
}
