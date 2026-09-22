from fastapi import APIRouter, Depends
from typing import List
from app.api.deps import api_key
from app.models.schemas import MatchRequest, MatchResponse
from app.services.matching_service import HybridMatcher

router = APIRouter(prefix="/match", tags=["matching"])

@router.post("/compute", response_model=MatchResponse, dependencies=[api_key])
async def compute_match(req: MatchRequest):
    """Compute detailed 8-factor match score for user x job."""
    matcher = HybridMatcher()
    
    # Pack parameters matching matching_service expectation
    match_req = {
        "user_skills": req.user_skills,
        "resume_skills": req.resume_skills,
        "resume_embedding": req.resume_embedding,
        "resume_completeness_score": req.resume_completeness_score,
        "target_roles": req.target_roles,
        "preferred_locations": req.preferred_locations,
        "preferred_work_mode": req.preferred_work_mode,
        "job_title": req.job_title,
        "job_description": req.job_description,
        "job_required_skills": req.job_required_skills,
        "job_preferred_skills": req.job_preferred_skills,
        "job_location": req.job_location,
        "job_remote_type": req.job_remote_type,
        "job_experience_level": req.job_experience_level,
        "job_source": req.job_source,
        "job_confidence_score": req.job_confidence_score,
        "job_posted_at": req.job_posted_at,
        "job_embedding": req.job_embedding
    }
    
    result = matcher.compute(match_req)
    return MatchResponse(**result)
