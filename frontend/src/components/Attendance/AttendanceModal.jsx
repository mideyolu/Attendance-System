import "./Attendance.css";
import Attendance from "./Attendance";
import { useState } from "react";

/* eslint-disable react/prop-types */
export default function AttendanceModal({
  isOpen,
  onClose,
  onAttendanceMarked,
}) {
  if (!isOpen) return null;

  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh the attendance component inside modal
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Close modal and reset attendance component
  const handleClose = () => {
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
            onAttendanceMarked={onAttendanceMarked}
          />
        </div>
      </div>
    </div>
  );
}

function AttendanceWrapper({ onClose, onAddUser, onAttendanceMarked }) {
  return (
    <Attendance
      onClose={onClose}
      onAddUser={onAddUser}
      onAttendanceMarked={onAttendanceMarked}
    />
  );
}
