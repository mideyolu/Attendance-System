**# Smart Class Attendance System**



**Facial recognition-based attendance system with liveness detection.**



**## Features**

**- KYC-style liveness verification (random challenges)**

**- Multi-frame face matching (5 frames averaged)**

**- FaceNet512 + FAISS for fast, accurate recognition**

**- Real-time dashboard with CSV export**

**- CLAHE preprocessing for low-light conditions**



**## Tech Stack**

**\*\*Frontend:\*\* React + Vite, MediaPipe, React Hot Toast**  

**\*\*Backend:\*\* FastAPI, FaceNet512, FAISS, OpenCV, Pandas**  

**\*\*Storage:\*\* CSV files (local)**



**## Setup Instructions**



**### Prerequisites**

**- Python 3.10+**

**- Node.js 16+**

**- Webcam**



**### Backend Setup**

**```bash**

**cd backend**

**pip install -r requirements.txt --break-system-packages**

**python -m uvicorn backend.main:app --reload**

**```**

**Backend runs on `http://localhost:8000`**



**### Frontend Setup**

**```bash**

**cd frontend**

**npm install**

**npm run dev**

**```**

**Frontend runs on `http://localhost:5173`**



**## Usage**



**### 1. Enrollment**

**- Navigate to "Onboarding"**

**- Fill in Name (min 8 chars), RegNo, Gender, IT Type**

**- Click "Start Capture"**

**- System captures 10 images from different angles**

**- Enrollment complete**



**### 2. Attendance**

**- Navigate to "Attendance Tracking"**

**- Click "Start Verification"**

**- Complete random liveness challenge (Blink/Smile/Turn Left/Turn Right)**

**- System captures 5 frames and matches against database**

**- Click "Submit Attendance" to log**



**### 3. Dashboard**

**- View total records and present count**

**- Export attendance logs to CSV**



**## Project Structure

backend/**

**├── main.py              # FastAPI entry point**

**├── routes/**

**│   ├── enroll.py        # Enrollment endpoint**

**│   ├── attendance.py    # Attendance endpoint**

**│   └── stats.py         # Dashboard stats**

**├── services/**

**│   └── face\_service.py  # FAISS + FaceNet integration**

**├── models/**

**│   └── facenet512.onnx  # Face recognition model**

**└── data/**

**├── enrollments.csv  # User data + embeddings**

**└── attendance.csv   # Attendance logs**

**frontend/**

**├── src/**

**│   ├── components/**

**│   │   ├── Attendance/  # Attendance verification**

**│   │   ├── Enroll/      # Enrollment flow**

**│   │   ├── Dashboard/   # Main dashboard**

**│   │   └── Stats/       # Stats components**

**│   └── hooks/**

**│       ├── useLive.jsx  # Liveness detection**

**│       ├── useFaceLoop.jsx**

**│       └── useFaceCapture.jsx**

**└── package.json



## Team**

**- \*\*Group Leader:\*\* Valentine.**

**- \*\*Tech Lead:\*\* Ismail**

**- \*\*Members:\*\* Ahmad, Ademola, Sa'ad**



**## License**

**MIT**

