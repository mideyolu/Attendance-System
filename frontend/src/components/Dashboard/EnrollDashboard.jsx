import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { getEnrollStats } from "../../services/api";
import EnrollmentModal from "../Enroll/EnrollmentModal";
import GenderChart from "../Stats/GenderChart";
import HourChart from "../Stats/HourChart";
import StatsCard from "../Stats/StatsCard";
import UserTable from "../Stats/UserTable";
import "../Stats/Dashboard.css";

export default function EnrollDashboard() {
    const [stats, setStats] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getEnrollStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = async () => {
        setIsModalOpen(false);

        setTimeout(() => {
            fetchStats();
        }, 300);
    };

    const handleEnrollmentSuccess = async () => {
        setIsModalOpen(false);
        await fetchStats();
    };

    if (loading || !stats)
        return <div className="dashboard-wrapper">Loading...</div>;

    const maleCount = stats.male ?? stats.gender?.male ?? 0;
    const femaleCount = stats.female ?? stats.gender?.female ?? 0;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="brand">
                    <span>Smart Class Enrollment</span>
                </div>

                <div className="nav-group">
                    <div className="nav-label">Platform</div>
                    <a href="#" className="sidebar-link active">
                        <span>📊</span> Dashboard
                    </a>

                    <Link
                        to="#"
                        onClick={handleOpenModal}
                        className="sidebar-link"
                    >
                        <span>👥</span> Enroll User
                    </Link>

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
                        <h1>Dashboard</h1>
                        <p>Overview of enrollment metrics and system status.</p>
                    </div>
                </div>

                {/* KPI */}
                <div className="kpi-grid">
                    <StatsCard title="Total Users" value={stats.total_users} />
                    <StatsCard title="Male" value={maleCount} />
                    <StatsCard title="Female" value={femaleCount} />
                    <StatsCard
                        title="Last Activity"
                        value={stats.last_enrolled || "Just now"}
                    />
                </div>

                {/* CHARTS */}
                <div className="chart-grid">
                    <GenderChart male={maleCount} female={femaleCount} />
                    <HourChart peakHour={stats.peak_hour} />
                </div>

                {/* TABLE */}
                <UserTable
                    text="Add New User"
                    data={stats.table || []}
                    onAddUser={handleOpenModal}
                />
            </main>

            {/* MODAL */}
            <EnrollmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleEnrollmentSuccess}
            />
        </div>
    );
}
