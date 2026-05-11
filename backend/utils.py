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
        except Exception:
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



from collections import Counter
from datetime import datetime

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

    users_map = {}   
    hours = []

    # -----------------------------
    # DEDUP BY REGNO
    # -----------------------------
    for row in raw_data:

        regno = row.get("regno", "")
        if not regno:
            continue

        dt = parse_dt(row.get("created_at"))
        hours.append(dt.hour)

        # keep ONLY latest entry per regno
        if regno not in users_map:
            users_map[regno] = {
                "regno": regno,
                "name": row.get("name", ""),
                "gender": row.get("gender", "unknown"),
                "itype": row.get("itype", ""),
                "enrolled_date": dt.strftime(DATETIME_FORMAT),
                "created_at_raw": dt
            }
        else:
            # keep most recent record
            if dt > users_map[regno]["created_at_raw"]:
                users_map[regno].update({
                    "name": row.get("name", ""),
                    "gender": row.get("gender", "unknown"),
                    "itype": row.get("itype", ""),
                    "enrolled_date": dt.strftime(DATETIME_FORMAT),
                    "created_at_raw": dt
                })

    # convert dict → list
    users = list(users_map.values())

    # -----------------------------
    # STATS
    # -----------------------------
    males = sum(1 for u in users if u["gender"].lower() == "male")
    females = sum(1 for u in users if u["gender"].lower() == "female")

    peak = Counter(hours).most_common(1)[0][0] if hours else 0
    latest_dt = max(u["created_at_raw"] for u in users)

    # cleanup response (remove helper field)
    for u in users:
        u.pop("created_at_raw", None)

    return {
        "total_users": len(users),   # ✅ FIXED (unique users only)
        "gender": {"male": males, "female": females},
        "peak_hour": f"{peak:02d}:00 - {peak+1:02d}:00",
        "system_status": "Active",
        "last_enrolled": format_time_ago(latest_dt),
        "table": users,
    }


from collections import Counter
from datetime import datetime


def compute_attendance_stats():
    raw_data = read_attendance_logs()

    if not raw_data:
        return {
            "total_records": 0,
            "present": 0,
            "unknown": 0,
            "error": 0,
            "attendance_rate": 0,
            "peak_hour": "N/A",
            "table": [],
        }

    table = []

    present = 0
    unknown = 0
    error = 0

    hour_counter = Counter()

    for i, row in enumerate(raw_data, start=1):
        status = row.get("status", "").upper()

        if status == "PRESENT":
            present += 1

        elif status == "UNKNOWN":
            unknown += 1

        elif status == "ERROR":
            error += 1

        timestamp = row.get("timestamp", "")

        # ================= PEAK HOUR =================
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp)
                hour = dt.strftime("%I %p")
                hour_counter[hour] += 1
            except Exception:
                pass

        table.append(
            {
                "sn": i+1,
                "regno": row.get("regno", ""),
                "name": row.get("name", ""),
                "itype": row.get("itype", ""),
                "status": status,
                "score": float(row["score"]) if row.get("score") else None,
                "metric": row.get("metric", ""),
                "date": row.get("date", ""),
                "time": row.get("time", ""),
                "timestamp": timestamp,
            }
        )

    total_records = len(table)

    attendance_rate = (
        round((present / total_records) * 100, 2) if total_records > 0 else 0
    )

    peak_hour = hour_counter.most_common(1)[0][0] if hour_counter else "N/A"

    return {
        "total_records": total_records,
        "present": present,
        "unknown": unknown,
        "error": error,
        "attendance_rate": attendance_rate,
        "peak_hour": peak_hour,
        "table": table,
    }


# def compute_attendance_stats():
#     raw_data = read_attendance_logs()

#     if not raw_data:
#         return {
#             "total_records": 0,
#             "present": 0,
#             "table": [],
#         }

#     table = []
#     present = 0
#     unknown = 0
#     error = 0

#     for i, row in enumerate(raw_data, start=1):
#         status = row.get("status", "").upper()

#         if status == "PRESENT":
#             present += 1

#         table.append({
#             "sn": i,
#             "regno": row.get("regno", ""),
#             "name": row.get("name", ""),
#             "itype": row.get("itype", ""),
#             "status": status,
#             "score": float(row["score"]) if row.get("score") else None,
#             "metric": row.get("metric", ""),
#             "date": row.get("date", ""),
#             "time": row.get("time", ""),
#             "timestamp": row.get("timestamp", ""),
#         })


#     return {
#         "total_records": len(table),
#         "present": present,
#         "unknown": unknown,
#         "error": error,
#         "table": table,
#     }
