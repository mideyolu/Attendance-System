import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { getAttendanceStats } from "../../services/api";
import AttendanceModal from "../Attendance/AttendanceModal";
import AttendanceTable from "../Stats/AttendanceTable";
import StatsCard from "../Stats/StatsCard";
import "../Stats/Dashboard.css";

export default function AttendanceDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

    //  Loading Stats
    const fetchStats = useCallback(async () => {
        try {
            const data = await getAttendanceStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats, refreshKey]);

    const handleOpenAttendance = () => setIsAttendanceOpen(true);

    const handleCloseAttendance = () => {
        setIsAttendanceOpen(false);
        // Optional: Force a refresh immediately when closing if not done via callback
        // setRefreshKey(prev => prev + 1);
    };

    const handleDataAdded = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (loading || !stats)
        return <div className="dashboard-wrapper">Loading...</div>;

    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="brand">
                    <span>Smart Class Attendance</span>
                </div>
                <div className="nav-group">
                    <div className="nav-label">Platform</div>
                    <a href="#" className="sidebar-link active">
                        <span>📊</span> Dashboard
                    </a>
                    <a
                        href="#"
                        className="sidebar-link"
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpenAttendance();
                        }}
                    >
                        <span>👥</span> Attendance
                    </a>
                    <Link to="/" className="sidebar-link">
                        <span>👤</span> Onboarding
                    </Link>
                </div>
            </aside>

            {/* MAIN */}
            <main className="dashboard-wrapper">
                <div className="dashboard-header">
                    <div className="dashboard-title">
                        <h1>Attendance Dashboard</h1>
                        <p>
                            Overview of recognition logs and attendance
                            activity.
                        </p>
                    </div>
                </div>

                <div className="kpi-grid">
                    <StatsCard
                        title="Total Records"
                        value={stats.total_records}
                    />
                    <StatsCard title="Present" value={stats.present} />
                    <StatsCard
                        title="Attendance Rate"
                        value={`${stats.attendance_rate} %`}
                    />
                    <StatsCard title="Peak Hour" value={stats.peak_hour} />
                </div>

                <AttendanceTable
                    data={[...stats.table].reverse()}
                    key={refreshKey}
                />
            </main>

            <AttendanceModal
                isOpen={isAttendanceOpen}
                onClose={handleCloseAttendance}
                onAttendanceMarked={handleDataAdded}
            />
        </div>
    );
}
