from fastapi import APIRouter, Depends
from app.api.deps import api_key
from app.models.schemas import SummarizeRequest, SummarizeResponse, SkillExtractionRequest, SkillExtractionResponse
from app.services.summarizer import TextSummarizer
from app.services.skill_taxonomy import extract_skills_from_text

router = APIRouter(tags=["summarization"])

@router.post("/summarize", response_model=SummarizeResponse, dependencies=[api_key])
async def summarize_text(req: SummarizeRequest):
    """Summarize raw company posts or technical descriptions."""
    summarizer = TextSummarizer()
    summary = summarizer.summarize(req.text, req.max_sentences)
    return SummarizeResponse(summary=summary)

@router.post("/skills/extract", response_model=SkillExtractionResponse, dependencies=[api_key])
async def extract_skills(req: SkillExtractionRequest):
    """Extract canonical skills list from unstructured job description."""
    skills = extract_skills_from_text(req.text)
    return SkillExtractionResponse(skills=skills)
