import "./Attendance.css";
import Attendance from "./Attendance";
import { useState } from "react";

/* eslint-disable react/prop-types */
export default function AttendanceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleClose = () => {
    // Increment key to force Attendance component to remount with fresh state
    setRefreshKey((prev) => prev + 1);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Take Attendance</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <AttendanceWrapper
            key={refreshKey}
            onClose={handleClose}
            onAddUser={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}

function AttendanceWrapper({ onClose, onAddUser }) {
  return <Attendance onClose={onClose} onAddUser={onAddUser} />;
}
