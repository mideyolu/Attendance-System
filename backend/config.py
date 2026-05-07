import os

DIM = 512

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/

DATA_DIR = os.path.join(BASE_DIR, "data")

CSV_FILE = os.path.join(DATA_DIR, "enrollments.csv")
ATTENDANCE_LOG = os.path.join(DATA_DIR, "attendance.csv")

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S.%f"

# ensure folder exists
os.makedirs(DATA_DIR, exist_ok=True)
