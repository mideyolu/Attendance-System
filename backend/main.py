from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import enroll, attendance, stats


app = FastAPI()


# ================= INIT =================
@app.on_event("startup")
def startup_event():
    pass


# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= ROUTES =================
app.include_router(enroll.router)
app.include_router(attendance.router)
app.include_router(stats.router)
