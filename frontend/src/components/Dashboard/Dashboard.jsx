import { useNavigate } from "react-router";
import "../../App.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "enrollment",
      title: "Student Enrollment",
      desc: "Register new students and manage profiles.",
      path: "/dashboard/enrollment",
      icon: "👤"
    },
    {
      id: "attendance",
      title: "Attendance Tracking",
      desc: "Monitor real-time logs and generate reports.",
      path: "/dashboard/attendance",
      icon: "📅"
    }
  ];

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <span className="system-badge">System Portal</span>
        <h1>Welcome to Smart Class</h1>
        <p>Select your workspace to get started with today's tasks.</p>
      </header>

      <div className="onboarding-grid">
        {modules.map((m) => (
          <button
            key={m.id}
            className={`module-card ${m.id}`}
            onClick={() => navigate(m.path)}
          >
            <div className="module-icon">{m.icon}</div>
            <div className="module-content">
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </div>
            <div className="module-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}
