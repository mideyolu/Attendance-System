import cv2
from datetime import datetime
from collections import Counter
from backend.db import read_raw_users
from backend.config import DATETIME_FORMAT
import logging
from backend.db import read_attendance_logs

logger = logging.getLogger("attendance")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)


def parse_dt(value):
    for fmt in (DATETIME_FORMAT, "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except:
            continue
    return datetime.now()


def format_time_ago(dt):
    diff = datetime.now() - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just Now"
    if seconds < 3600:
        return f"{seconds // 60} minute(s) ago"
    if seconds < 86400:
        return f"{seconds // 3600} hour(s) ago"
    return f"{diff.days} day(s) ago"


def compute_stats():
    raw_data = read_raw_users()

    if not raw_data:
        return {
            "total_users": 0,
            "gender": {"male": 0, "female": 0},
            "peak_hour": "No data",
            "system_status": "Idle",
            "last_enrolled": "N/A",
            "table": [],
        }

    users = []
    hours = []

    for row in raw_data:
        dt = parse_dt(row.get("created_at"))

        hours.append(dt.hour)

        users.append(
            {
                "sn": row.get("S/N"),
                "regno": row.get("regno", ""),
                "name": row.get("name", ""),
                "gender": row.get("gender", "unknown"),
                "itype": row.get("itype", ""),
                "enrolled_date": dt.strftime(DATETIME_FORMAT),
            }
        )

    males = sum(1 for u in users if u["gender"].lower() == "male")
    females = sum(1 for u in users if u["gender"].lower() == "female")

    peak = Counter(hours).most_common(1)[0][0]
    latest_dt = max(parse_dt(r.get("created_at")) for r in raw_data)

    return {
        "total_users": len(users),
        "gender": {"male": males, "female": females},
        "peak_hour": f"{peak:02d}:00 - {peak+1:02d}:00",
        "system_status": "Active",
        "last_enrolled": format_time_ago(latest_dt),
        "table": users,
    }

def compute_attendance_stats():
    raw_data = read_attendance_logs()

    if not raw_data:
        return {
            "total_records": 0,
            "present": 0,
            "table": [],
        }

    table = []
    present = 0
    unknown = 0
    error = 0

    for i, row in enumerate(raw_data, start=1):
        status = row.get("status", "").upper()

        if status == "PRESENT":
            present += 1

        table.append({
            "sn": i,
            "regno": row.get("regno", ""),
            "name": row.get("name", ""),
            "itype": row.get("itype", ""),
            "status": status,
            "score": float(row["score"]) if row.get("score") else None,
            "metric": row.get("metric", ""),
            "date": row.get("date", ""),
            "time": row.get("time", ""),
            "timestamp": row.get("timestamp", ""),
        })

    return {
        "total_records": len(table),
        "present": present,
        "unknown": unknown,
        "error": error,
        "table": table,
    }
