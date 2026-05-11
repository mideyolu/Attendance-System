# attendance.py
from fastapi import APIRouter
import logging
from backend.schemas import AttendanceRequest, LiveRecognitionResponse
from backend.services.attendance_service import AttendanceService

logger = logging.getLogger("attendance")
router = APIRouter()


@router.post("/attendance", response_model=LiveRecognitionResponse)
async def attendance(data: AttendanceRequest):
    try:
        logger.info("[REQUEST] Attendance triggered")

        result = AttendanceService.process_attendance(data.images)
        return result

    except Exception as e:
        logger.error(str(e), exc_info=True)

        return {
            "regno": "Unknown",
            "name": "Unknown",
            "itype": "",
            "attendance_status": "error",
            "confidence": None,
        }
