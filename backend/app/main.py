from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, goals, stats

app = FastAPI(title="GoalTracker API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(stats.router)


@app.get("/")
def read_root():
    return {"message": "GoalTracker API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
