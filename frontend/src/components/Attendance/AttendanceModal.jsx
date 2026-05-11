// import Attendance from "./Attendance";
// import "./Attendance.css";

// /* eslint-disable react/prop-types */
// export default function AttendanceModal({
//     isOpen,
//     onClose,
//     onAttendanceMarked,
// }) {
//     if (!isOpen) return null;

//     return (
//         <div className="modal-overlay">
//             <div className="modal-content">
//                 <div className="modal-header">
//                     <h2>Take Attendance</h2>
//                     <button className="modal-close-btn" onClick={onClose}>
//                         &times;
//                     </button>
//                 </div>

//                 <div className="modal-body">
//                     {/* ✅ PASS THE CALLBACK DOWN */}
//                     <Attendance
//                         onClose={onClose}
//                         onAddUser={onAttendanceMarked}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }


import "./Attendance.css";
import Attendance from "./Attendance";

/* eslint-disable react/prop-types */
export default function AttendanceModal({
    isOpen,
    onClose,
    onAttendanceMarked,
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* Stop propagation so clicking inside the modal doesn't close it */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Take Attendance</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {/* ✅ PASS THE CALLBACK DOWN */}
                    <Attendance
                        onClose={onClose}
                        onAddUser={onAttendanceMarked}
                    />
                </div>
            </div>
        </div>
    );
}
