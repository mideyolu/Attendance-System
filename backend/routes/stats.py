from fastapi import APIRouter
from backend.utils import compute_stats, compute_attendance_stats
from backend.schemas import StatsResponse, AttendanceStatsResponse

router = APIRouter()

@router.get("/enroll/stats", response_model=StatsResponse)
async def get_stats():
    return compute_stats()

@router.get("/attendance/stats", response_model=AttendanceStatsResponse)
async def get_attendance_stats():
    return compute_attendance_stats()
