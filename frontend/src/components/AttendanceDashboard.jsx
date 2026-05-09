import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import AttendanceModal from "../components/Attendance/AttendanceModal";

import { getAttendanceStats } from "../services/api";

import "./Stats/Dashboard.css";
import StatsCard from "./Stats/StatsCard";
import AttendanceTable from "./Stats/AttendanceTable";

export default function AttendanceDashboard() {
  const [stats, setStats] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
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

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ================= MODALS =================
  const handleOpenModal = () => setIsModalOpen(true);

  const handleOpenAttendance = () => setIsAttendanceOpen(true);
  const handleCloseAttendance = () => setIsAttendanceOpen(false);

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
        {/* HEADER */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Attendance Dashboard</h1>
            <p>Overview of recognition logs and attendance activity.</p>
          </div>
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          <StatsCard title="Total Records" value={stats.total_records} />
          <StatsCard title="Present" value={stats.present} />
        </div>

        {/* TABLE */}
        <AttendanceTable data={[...stats.table].reverse()} key={refreshKey} />
      </main>

      {/* ATTENDANCE MODAL */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={handleCloseAttendance}
      />
    </div>
  );
}
