from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from typing import List
from app.api.deps import api_key
from app.models.schemas import (
    ResumeParseResponse,
    EmbeddingResponse,
    EmbeddingRequest,
    CompositeResumeEmbeddingRequest,
    CompositeJobEmbeddingRequest,
    SkillExtractionRequest,
    SkillExtractionResponse
)
from app.services.resume_parser import ResumeParser
from app.services.resume_extractor import ResumeExtractor
from app.services.embedding_service import EmbeddingService
from app.services.skill_taxonomy import extract_skills_from_text

router = APIRouter(tags=["resume"])

@router.post("/resume/parse", response_model=ResumeParseResponse, dependencies=[api_key])
@router.post("/parse/resume", response_model=ResumeParseResponse, dependencies=[api_key])
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

@router.post("/resume/embed", response_model=EmbeddingResponse, dependencies=[api_key])
@router.post("/embed/text", response_model=EmbeddingResponse, dependencies=[api_key])
async def embed_resume_text(req: EmbeddingRequest):
    """Generate 384 dimensional text embeddings for parsed text."""
    embedder = EmbeddingService()
    vector = embedder.embed_text(req.text)
    return EmbeddingResponse(embedding=vector)

@router.post("/embed/resume", response_model=EmbeddingResponse, dependencies=[api_key])
async def embed_composite_resume(req: CompositeResumeEmbeddingRequest):
    """Generate composite resume embedding from all sections."""
    sections = []
    if req.summary:
        sections.append(req.summary)
    if req.skills:
        sections.append(f"Skills: {', '.join(req.skills)}")
    for exp in req.experience:
        sections.append(f"{exp.get('role', '')} {exp.get('company', '')}: {exp.get('description', '')}")
    for proj in req.projects:
        sections.append(f"{proj.get('name', '')}: {proj.get('description', '')}")
    for edu in req.education:
        sections.append(f"{edu.get('degree', '')} at {edu.get('college', '')}")

    composite_text = "\n".join(sections)
    embedder = EmbeddingService()
    vector = embedder.embed_text(composite_text)
    return EmbeddingResponse(embedding=vector)

@router.post("/embed/job", response_model=EmbeddingResponse, dependencies=[api_key])
async def embed_composite_job(req: CompositeJobEmbeddingRequest):
    """Generate composite job embedding from job title, description, and requirements."""
    fields = [req.title]
    if req.required_skills:
        fields.append(f"Required Skills: {', '.join(req.required_skills)}")
    if req.preferred_skills:
        fields.append(f"Preferred Skills: {', '.join(req.preferred_skills)}")
    if req.description:
        fields.append(req.description)

    composite_text = "\n".join(fields)
    embedder = EmbeddingService()
    vector = embedder.embed_text(composite_text)
    return EmbeddingResponse(embedding=vector)

@router.post("/skills/extract", response_model=SkillExtractionResponse, dependencies=[api_key])
async def extract_skills_endpoint(req: SkillExtractionRequest):
    """Extract skills from text using taxonomy."""
    skills = extract_skills_from_text(req.text)
    return SkillExtractionResponse(skills=skills)
