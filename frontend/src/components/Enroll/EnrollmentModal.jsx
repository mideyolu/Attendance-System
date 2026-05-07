import "./Enroll.css";
import Enrollment from "./Enrollment";

/* eslint-disable react/prop-types */
export default function EnrollmentModal({ isOpen, onClose, onSuccess }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>New Enrollment</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    <EnrollmentWrapper
                        onClose={onClose}
                        onSuccess={onSuccess}
                    />
                </div>
            </div>
        </div>
    );
}

function EnrollmentWrapper({ onClose, onSuccess }) {
    return <Enrollment onClose={onClose} onSuccess={onSuccess} />;
}
