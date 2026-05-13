# attendance.py
from fastapi import APIRouter
from datetime import datetime
import logging

from backend.schemas import (
    AttendanceRequest,
    LiveRecognitionResponse,
)

from backend.services.attendance_service import (
    AttendanceService,
)

logger = logging.getLogger("attendance")

router = APIRouter()


@router.post(
    "/attendance",
    response_model=LiveRecognitionResponse,
)
async def attendance(data: AttendanceRequest):

    try:

        logger.info("[REQUEST] Attendance recognition")

        result = AttendanceService.process_attendance(data.images)

        return result

    except Exception as e:

        logger.error(str(e), exc_info=True)

        return {
            "regno": "Unknown",
            "name": "Unknown",
            "itype": "",
            "attendance_status": "error",
            "margin": None,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "confidence": None,
        }


@router.post("/attendance/submit")
async def submit_attendance(data: dict):

    try:

        regno = data.get("regno")

        logger.info(f"[REQUEST] Submit attendance for {regno}")

        return AttendanceService.submit_attendance(regno)

    except Exception as e:

        logger.error(str(e), exc_info=True)

        return {
            "status": "error",
        }
