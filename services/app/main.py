import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.core.logging_config import setup_logging
from app.services.embedding_service import EmbeddingService
from app.ingestion.scheduler import IngestionScheduler

from app.api.routes import resume, matching, ingestion, summarize

# Setup system logger
setup_logging()

app = FastAPI(
    title="Job Intelligence Platform Microservices",
    description="Core backend for resume parsing, embedding vector generation, and hybrid matching",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to web frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include api routers
app.include_router(resume.router)
app.include_router(matching.router)
app.include_router(ingestion.router)
app.include_router(summarize.router)

scheduler = IngestionScheduler()

@app.on_event("startup")
async def startup_event():
    # Warm up sentence transformers model asynchronously
    embedder = EmbeddingService()
    embedder.initialize()
    # Start ingestion schedulers
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

@app.get("/health", tags=["health"])
async def health_check():
    embedder = EmbeddingService()
    return {
        "status": "healthy",
        "model_loaded": embedder._initialized,
        "timestamp": datetime.utcnow()
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
