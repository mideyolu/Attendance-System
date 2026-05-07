import csv
import os
import json
import pandas as pd
from datetime import datetime
import logging
from backend.config import CSV_FILE, DATETIME_FORMAT, ATTENDANCE_LOG

# =========================
# ENSURE FILE DIRECTORY EXISTS
# =========================
os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
logger = logging.getLogger("attendance")

# =========================
# SERIAL NUMBER
# =========================
def get_next_sn():
    if not os.path.isfile(CSV_FILE):
        return 1

    try:
        df = pd.read_csv(CSV_FILE)
        return len(df) + 1
    except:
        return 1


# =========================
# SAVE USER + EMBEDDING
# =========================
def save_to_csv(user, embedding):
    file_exists = os.path.isfile(CSV_FILE)

    # convert numpy → list → JSON string
    embedding_json = json.dumps(embedding.astype(float).tolist())

    sn = get_next_sn()

    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # header
        if not file_exists:
            writer.writerow(
                ["S/N", "regno", "name", "gender", "itype", "embedding", "created_at"]
            )

        # row
        writer.writerow(
            [
                sn,
                user.get("regno", ""),
                user.get("name", ""),
                user.get("gender", ""),
                user.get("itype", ""),
                embedding_json,
                datetime.now().strftime(DATETIME_FORMAT),
            ]
        )


def read_attendance_logs():
    if not os.path.exists(ATTENDANCE_LOG):
        return []

    with open(ATTENDANCE_LOG, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_attendance_log(user, metric, status, score=None, second_score=None):
    if (
        user.get("name") == "Unknown" or user.get("regno") == ""
    ) and status.upper() == "UNKNOWN":
        logger.info("Unknown user detected. Skipping log entry.")
        return

    os.makedirs(os.path.dirname(ATTENDANCE_LOG), exist_ok=True)

    file_exists = os.path.isfile(ATTENDANCE_LOG)

    now = datetime.now()
    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%H:%M:%S")
    timestamp = now.strftime(DATETIME_FORMAT)

    with open(ATTENDANCE_LOG, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # HEADER
        if not file_exists:
            writer.writerow(
                [
                    "regno",
                    "name",
                    "itype",
                    "status",
                    "score",
                    "metric",
                    "date",
                    "time",
                    "timestamp",
                ]
            )

        writer.writerow(
            [
                user.get("regno", ""),
                user.get("name", ""),
                user.get("itype", ""),
                status,
                round(score, 4) if score is not None else "",
                metric,
                date,
                time,
                timestamp,
            ]
        )


# =========================
# READ ALL USERS (RAW)
# =========================
def read_raw_users():
    if not os.path.exists(CSV_FILE):
        return []

    with open(CSV_FILE, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# =========================
# GET USER BY REGNO
# =========================
def get_user_by_regno(regno):
    if not os.path.exists(CSV_FILE):
        return None

    df = pd.read_csv(CSV_FILE)
    user = df[df["regno"] == regno]

    if user.empty:
        return None

    return user.iloc[0].to_dict()
