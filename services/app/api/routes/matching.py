from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.api.deps import api_key
from app.models.schemas import (
    MatchRequest,
    MatchResponse,
    BatchMatchRequest,
    BatchMatchResponse,
    RerankRequest,
    RerankResponse,
    ValidateExplanationRequest,
    ValidateExplanationResponse
)
from app.services.matching_service import ResearchEnhancedMatcher
from app.services.reranker_service import SelectiveLLMReranker, EvidenceValidator

router = APIRouter(prefix="/match", tags=["matching"])
matcher = ResearchEnhancedMatcher()
reranker = SelectiveLLMReranker()

@router.post("/compute", response_model=MatchResponse, dependencies=[api_key])
async def compute_match(req: MatchRequest):
    """Compute research-enhanced two-stage match score for user x job."""
    match_req = req.model_dump()
    result = matcher.compute_match(match_req, execute_rerank=req.execute_rerank)
    return MatchResponse(**result)

@router.post("/batch", response_model=BatchMatchResponse, dependencies=[api_key])
async def compute_batch_matches(req: BatchMatchRequest):
    """
    Score multiple jobs for a user in two stages:
    Stage A: Rank all jobs with 8-Factor + Taxonomy score
    Stage B: Selectively rerank the top-K jobs with LLM + evidence grounding
    """
    scored_candidates = []
    for job in req.jobs:
        match_req = {
            "user_skills": req.user_skills,
            "resume_skills": req.resume_skills,
            "resume_summary": req.resume_summary,
            "resume_text": req.resume_text,
            "resume_embedding": req.resume_embedding,
            "target_roles": req.target_roles,
            "preferred_locations": req.preferred_locations,
            "preferred_work_mode": req.preferred_work_mode,
            "job_id": str(job.get("id", "")),
            "job_title": job.get("job_title", ""),
            "company_name": job.get("company_name", ""),
            "job_required_skills": job.get("required_skills", job.get("skills_json", [])),
            "job_preferred_skills": job.get("preferred_skills", []),
            "job_description": job.get("description", ""),
            "job_location": job.get("location", "Unknown"),
            "job_remote_type": job.get("remote_type", "unknown"),
            "job_experience_level": job.get("experience_level", "entry"),
            "job_source": job.get("source", "direct"),
            "job_confidence_score": float(job.get("confidence_score") or 0.8),
            "job_posted_at": job.get("posted_at"),
            "job_embedding": job.get("embeddings_vector")
        }
        # Run Stage A retrieval
        res = matcher.compute_match(match_req, execute_rerank=False)
        scored_candidates.append({
            "job_id": match_req["job_id"],
            "raw_job": job,
            "match_data": res,
            "retrieval_score": res["enhanced_retrieval_score"]
        })

    # Sort by Stage A retrieval score
    scored_candidates.sort(key=lambda x: x["retrieval_score"], reverse=True)

    # Stage B: Rerank top-K candidates
    final_results = []
    for idx, candidate in enumerate(scored_candidates):
        if idx < req.top_k:
            # Execute rerank on top-K
            c_data = {
                "job_title": candidate["raw_job"].get("job_title", ""),
                "description": candidate["raw_job"].get("description", ""),
                "required_skills": candidate["raw_job"].get("skills_json", []),
                "matched_skills": candidate["match_data"]["explanation"]["matched_skills"],
                "missing_required": candidate["match_data"]["explanation"]["missing_required"],
                "enhanced_score": candidate["retrieval_score"]
            }
            rerank_res = reranker.rerank_candidate(
                candidate_data=c_data,
                resume_summary=req.resume_summary,
                resume_skills=req.resume_skills,
                resume_text=req.resume_text
            )
            r_score = rerank_res.get("rerank_score", candidate["retrieval_score"])
            if not rerank_res.get("fallback_used", False):
                f_score = round((0.80 * candidate["retrieval_score"]) + (0.20 * r_score), 1)
            else:
                f_score = candidate["retrieval_score"]

            # Update explanation
            exp = candidate["match_data"]["explanation"]
            exp["rerank_score"] = r_score
            exp["final_score"] = f_score
            exp["strengths"] = rerank_res.get("strengths", [])
            exp["gaps"] = rerank_res.get("gaps", [])
            exp["why_ranked_here"] = rerank_res.get("why_ranked_here", "")
            exp["reranker_model"] = rerank_res.get("model", "unknown")
            exp["fallback_used"] = rerank_res.get("fallback_used", True)

            candidate["match_data"]["final_score"] = f_score
            candidate["match_data"]["rerank_score"] = r_score

        final_results.append({
            "job_id": candidate["job_id"],
            "final_score": candidate["match_data"]["final_score"],
            "match_score": candidate["match_data"]["match_score"],
            "enhanced_retrieval_score": candidate["match_data"]["enhanced_retrieval_score"],
            "taxonomy_score": candidate["match_data"]["taxonomy_score"],
            "rerank_score": candidate["match_data"]["rerank_score"],
            "factor_scores": candidate["match_data"]["factor_scores"],
            "explanation": candidate["match_data"]["explanation"]
        })

    # Sort final results by final_score
    final_results.sort(key=lambda x: x["final_score"], reverse=True)
    return BatchMatchResponse(results=final_results)

@router.post("/rerank", response_model=RerankResponse, dependencies=[api_key])
async def rerank_candidate_endpoint(req: RerankRequest):
    """Selective LLM reranking for a candidate."""
    result = reranker.rerank_candidate(
        candidate_data=req.candidate,
        resume_summary=req.resume_summary,
        resume_skills=req.resume_skills,
        resume_text=req.resume_text
    )
    return RerankResponse(**result)

@router.post("/validate-explanation", response_model=ValidateExplanationResponse, dependencies=[api_key])
async def validate_explanation_endpoint(req: ValidateExplanationRequest):
    """Check that cited evidence claims appear in resume or job text."""
    v_strengths, v_gaps = EvidenceValidator.filter_evidence_claims(
        strengths=req.strengths,
        gaps=req.gaps,
        resume_text=req.resume_text,
        job_text=req.job_text
    )
    return ValidateExplanationResponse(
        validated_strengths=v_strengths,
        validated_gaps=v_gaps
    )
