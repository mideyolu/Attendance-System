import logging
from fastapi import APIRouter

from backend.schemas import EnrollmentRequest
from backend.services.enrollment_service import EnrollmentService

logger = logging.getLogger("enrollment")
router = APIRouter()


@router.post("/enroll")
async def enroll(data: EnrollmentRequest):
    try:
        logger.info(f"[ENROLL START] regno={data.user.regno}")

        result = EnrollmentService.process_enrollment(
            data.user,
            data.images
        )

        return result

    except Exception as e:
        logger.error(f"[ENROLL ERROR] {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}
