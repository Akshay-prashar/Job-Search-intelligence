from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import db_session, api_key
from app.models.schemas import ResumeParseResponse, EmbeddingResponse, EmbeddingRequest
from app.services.resume_parser import ResumeParser
from app.services.resume_extractor import ResumeExtractor
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/resume", tags=["resume"])

@router.post("/parse", response_model=ResumeParseResponse, dependencies=[api_key])
async def parse_resume(file: UploadFile = File(...)):
    """Parse uploaded resume PDF and return structured JSON."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume uploads are supported."
        )
        
    try:
        content = await file.read()
        
        # 1. Parse text from PDF
        parser = ResumeParser()
        raw_text = parser.parse_pdf(content)
        
        # 2. Extract structured data
        extractor = ResumeExtractor()
        parsed_data = extractor.extract_structured_data(raw_text)
        
        return ResumeParseResponse(**parsed_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing resume: {str(e)}"
        )

@router.post("/embed", response_model=EmbeddingResponse, dependencies=[api_key])
async def embed_resume_text(req: EmbeddingRequest):
    """Generate 384 dimensional text embeddings for parsed resume."""
    embedder = EmbeddingService()
    vector = embedder.embed_text(req.text)
    return EmbeddingResponse(embedding=vector)
