"""
Provider Performance OS MVP API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import organizations, provider_snapshot

app = FastAPI(
    title="Provider Performance OS API",
    description="Value-based performance tracking and analytics",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(organizations.router)
app.include_router(provider_snapshot.router)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Provider Performance OS API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0"
    }
