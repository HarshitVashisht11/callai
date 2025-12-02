from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import agents, campaigns, realtime

settings = get_settings()

app = FastAPI(
    title="Voice Agent API",
    description="AI-powered voice agent for sales campaigns and appointment booking",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url] if settings.frontend_url else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(realtime.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Voice Agent API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
