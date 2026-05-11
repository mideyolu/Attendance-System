import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Route, Routes } from "react-router";
import AttendanceDashboard from "./components/Dashboard/AttendanceDashboard";
import Dashboard from "./components/Dashboard/Dashboard";
import EnrollDashboard from "./components/Dashboard/EnrollDashboard";

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard/enrollment" element={<EnrollDashboard />} />
                <Route
                    path="/dashboard/attendance"
                    element={<AttendanceDashboard />}
                />
            </Routes>

            <ToastContainer position="top-right" autoClose={2500} />
        </>
    );
}
