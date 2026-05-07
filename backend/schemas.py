from pydantic import BaseModel, Field
from typing import List, Dict

class User(BaseModel):
    name: str = Field(..., min_length=8)
    regno: str
    gender: str
    itype: str

class EnrollmentRequest(BaseModel):
    user: User
    images: List[str] = Field(..., min_length=5, max_length=20)

class GenderStats(BaseModel):
    male: int
    female: int

class TableRow(BaseModel):
    sn: int
    regno: str
    name: str
    itype: str
    enrolled_date: str

class StatsResponse(BaseModel):
    total_users: int
    gender: Dict[str, int]
    peak_hour: str
    system_status: str
    last_enrolled: str
    table: List[TableRow]


class AttendanceRequest(BaseModel):
    images: List[str]

class LiveRecognitionResponse(BaseModel):
    regno: str
    name: str
    itype: str
    attendance_status: str
    date: str


class AttendanceRow(BaseModel):
    sn: int
    regno: str
    name: str
    itype: str
    status: str
    score: float | None
    metric: str
    date: str
    time: str
    timestamp: str


class AttendanceStatsResponse(BaseModel):
    total_records: int
    present: int
    unknown: int
    error: int
    table: List[AttendanceRow]
