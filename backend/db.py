# import csv
# import os
# import json
# import pandas as pd
# from datetime import datetime
# import logging
# from backend.config import CSV_FILE, DATETIME_FORMAT, ATTENDANCE_LOG

# # ENSURE FILE DIRECTORY EXISTS
# os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
# logger = logging.getLogger("attendance")


# # SERIAL NUMBER
# def get_next_sn():
#     if not os.path.isfile(CSV_FILE):
#         return 1

#     try:
#         df = pd.read_csv(CSV_FILE)
#         return len(df) + 1
#     except:
#         return 1


# # SAVE USER + EMBEDDING
# def save_to_csv(user, embedding):
#     file_exists = os.path.isfile(CSV_FILE)

#     # convert numpy → list → JSON string
#     embedding_json = json.dumps(embedding.astype(float).tolist())

#     sn = get_next_sn()

#     with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
#         writer = csv.writer(f)

#         # header
#         if not file_exists:
#             writer.writerow(
#                 ["S/N", "regno", "name", "gender", "itype", "embedding", "created_at"]
#             )

#         # row
#         writer.writerow(
#             [
#                 sn,
#                 user.get("regno", ""),
#                 user.get("name", ""),
#                 user.get("gender", ""),
#                 user.get("itype", ""),
#                 embedding_json,
#                 datetime.now().strftime(DATETIME_FORMAT),
#             ]
#         )


# def read_attendance_logs():
#     if not os.path.exists(ATTENDANCE_LOG):
#         return []

#     with open(ATTENDANCE_LOG, "r", encoding="utf-8") as f:
#         return list(csv.DictReader(f))


# def save_attendance_log(user, metric, status, score=None, second_score=None):
#     if (
#         user.get("name") == "Unknown"
#         or user.get("regno") == ""
#     ) and status.upper() == "UNKNOWN":
#         logger.info("Unknown user detected. Skipping log entry.")
#         return

#     os.makedirs(os.path.dirname(ATTENDANCE_LOG), exist_ok=True)

#     file_exists = os.path.isfile(ATTENDANCE_LOG)

#     now = datetime.now()
#     date = now.strftime("%Y-%m-%d")
#     time = now.strftime("%H:%M:%S")
#     timestamp = now.strftime(DATETIME_FORMAT)

#     with open(ATTENDANCE_LOG, "a", newline="", encoding="utf-8") as f:
#         writer = csv.writer(f)

#         # HEADER
#         if not file_exists:
#             writer.writerow(
#                 [
#                     "name",
#                     "regno",
#                     "itype",
#                     "status",
#                     "score",
#                     "metric",
#                     "date",
#                     "time",
#                     "timestamp",
#                 ]
#             )

#         # ROW
#         writer.writerow(
#             [
#                 user.get("name", ""),
#                 user.get("regno", ""),
#                 user.get("itype", ""),
#                 status,
#                 round(score, 4) if score is not None else "",
#                 metric,
#                 date,
#                 time,
#                 timestamp,
#             ]
#         )


# # READ ALL USERS (RAW)
# def read_raw_users():
#     if not os.path.exists(CSV_FILE):
#         return []

#     with open(CSV_FILE, "r", encoding="utf-8") as f:
#         return list(csv.DictReader(f))


# # GET USER BY REGNO
# def get_user_by_regno(regno):
#     if not os.path.exists(CSV_FILE):
#         return None

#     df = pd.read_csv(CSV_FILE)
#     user = df[df["regno"] == regno]

#     if user.empty:
#         return None

#     return user.iloc[0].to_dict()


# def has_marked_attendance_today(regno: str):

#     if not os.path.exists(ATTENDANCE_LOG):
#         return False

#     today = datetime.now().strftime("%Y-%m-%d")

#     logger.info(f"[SEARCHING] Duplicate check for: {regno}")

#     try:
#         with open(ATTENDANCE_LOG, "r", encoding="utf-8") as f:
#             reader = csv.DictReader(f)

#             for row in reader:

#                 saved_regno = str(row.get("regno", "")).strip()
#                 saved_date = str(row.get("date", "")).strip()
#                 saved_status = str(row.get("status", "")).strip().upper()

#                 logger.info(
#                     f"[ROW] CSV -> {saved_regno} | {saved_date} | {saved_status}"
#                 )

#                 if (
#                     saved_regno == str(regno).strip()
#                     and saved_date == today
#                     and saved_status == "PRESENT"
#                 ):

#                     logger.info(
#                         f"[DUPLICATE] Attendance already marked for {regno}"
#                     )

#                     return True

#     except Exception as e:
#         logger.error(f"Attendance check failed: {e}")

#     logger.info(f"[CLEAR] No attendance found for {regno}")

#     return False


import csv
import os
import json
import pandas as pd
from datetime import datetime
import logging
from backend.config import CSV_FILE, DATETIME_FORMAT, ATTENDANCE_LOG

os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
logger = logging.getLogger("attendance")

# SAVE USER + EMBEDDING
def save_to_csv(user, embedding):
    file_exists = os.path.isfile(CSV_FILE)

    # Convert numpy → list → JSON string
    embedding_json = json.dumps(embedding.astype(float).tolist())

    # Use quoting=csv.QUOTE_ALL to prevent commas in embeddings/names from splitting columns
    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)

        # Header: 6 Columns (No S/N)
        if not file_exists:
            writer.writerow([
                "regno", 
                "name", 
                "gender", 
                "itype", 
                "embedding", 
                "created_at"
            ])

        # Row: 6 Columns
        writer.writerow([
            user.get("regno", ""),
            user.get("name", ""),
            user.get("gender", ""),
            user.get("itype", ""),
            embedding_json,
            datetime.now().strftime(DATETIME_FORMAT),
        ])

def read_attendance_logs():
    if not os.path.exists(ATTENDANCE_LOG):
        return []
    with open(ATTENDANCE_LOG, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def save_attendance_log(user, metric, status, score=None, second_score=None):
    if (user.get("name") == "Unknown" or user.get("regno") == "") and status.upper() == "UNKNOWN":
        logger.info("Unknown user detected. Skipping log entry.")
        return

    os.makedirs(os.path.dirname(ATTENDANCE_LOG), exist_ok=True)
    file_exists = os.path.isfile(ATTENDANCE_LOG)

    now = datetime.now()
    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%H:%M:%S")
    timestamp = now.strftime(DATETIME_FORMAT)

    with open(ATTENDANCE_LOG, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)

        if not file_exists:
            writer.writerow([
                "name", "regno", "itype", "status", 
                "score", "metric", "date", "time", "timestamp"
            ])

        writer.writerow([
            user.get("name", ""),
            user.get("regno", ""),
            user.get("itype", ""),
            status,
            round(score, 4) if score is not None else "",
            metric,
            date,
            time,
            timestamp,
        ])

def read_raw_users():
    if not os.path.exists(CSV_FILE):
        return []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def get_user_by_regno(regno):
    if not os.path.exists(CSV_FILE):
        return None
    try:
        df = pd.read_csv(CSV_FILE, on_bad_lines='skip')
        user = df[df["regno"] == regno]
        if user.empty:
            return None
        return user.iloc[0].to_dict()
    except Exception as e:
        logger.error(f"Error reading user: {e}")
        return None

def has_marked_attendance_today(regno: str):
    if not os.path.exists(ATTENDANCE_LOG):
        return False

    today = datetime.now().strftime("%Y-%m-%d")
    logger.info(f"[SEARCHING] Duplicate check for: {regno}")

    try:
        with open(ATTENDANCE_LOG, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                saved_regno = str(row.get("regno", "")).strip()
                saved_date = str(row.get("date", "")).strip()
                saved_status = str(row.get("status", "")).strip().upper()

                if (saved_regno == str(regno).strip() and 
                    saved_date == today and 
                    saved_status == "PRESENT"):
                    logger.info(f"[DUPLICATE] Attendance already marked for {regno}")
                    return True
    except Exception as e:
        logger.error(f"Attendance check failed: {e}")

    logger.info(f"[CLEAR] No attendance found for {regno}")
    return False