import math
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.services.taxonomy_service import TaxonomyService
from app.services.reranker_service import SelectiveLLMReranker

class ResearchEnhancedMatcher:
    """
    Research-Enhanced Two-Stage Matching Pipeline:
    - Stage A: Deterministic + Semantic Retrieval (8-factor hybrid + ESCO taxonomy alignment)
    - Stage B: Selective LLM Reranking (top-K) with Evidence Validation
    """

    BASE_WEIGHTS = {
        "exact_skill":       0.25,
        "semantic":          0.20,
        "fresher_fit":       0.15,
        "role_relevance":    0.10,
        "logistics":         0.10,
        "recency":           0.10,
        "source_confidence": 0.05,
        "completeness":      0.05,
    }

    TAXONOMY_WEIGHT = 0.10
    RERANK_WEIGHT = 0.20

    def __init__(self):
        self.taxonomy = TaxonomyService()
        self.reranker = SelectiveLLMReranker()

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude_v1 = math.sqrt(sum(a * a for a in v1))
        magnitude_v2 = math.sqrt(sum(b * b for b in v2))
        if magnitude_v1 == 0.0 or magnitude_v2 == 0.0:
            return 0.0
        return dot_product / (magnitude_v1 * magnitude_v2)

    def _compute_fresher_fit(self, title: str, description: str, experience_level: str) -> Tuple[float, str]:
        score = 50.0
        reason = "Standard entry requirements indicated."
        
        t_lower = (title or "").lower()
        d_lower = (description or "").lower()
        
        fresher_keywords = ["intern", "new grad", "entry level", "junior", "fresher", "associate", "trainee", "graduate", "0-1 year", "0-2 year"]
        for kw in fresher_keywords:
            if kw in t_lower or kw in d_lower:
                score = 90.0
                reason = f"Job mentions '{kw}' — high suitability for freshers and new graduates."
                break
                
        senior_keywords = ["senior", "lead", "principal", "staff", "architect", "manager", "director", "5+ years", "7+ years"]
        for kw in senior_keywords:
            if kw in t_lower or kw in d_lower:
                score = 15.0
                reason = f"Job mentions '{kw}' — requires substantial prior industry experience."
                break
                
        if experience_level == "intern":
            score = 98.0
            reason = "Internship role — ideal match for student or recent graduate."
        elif experience_level == "entry":
            score = 88.0
            reason = "Entry-level position — tailored for early career developers."
            
        return score, reason

    def _compute_logistics(self, preferred_locations: List[str], preferred_work_mode: str, job_location: str, job_remote_type: str) -> Tuple[float, str]:
        score = 50.0
        reasons = []
        
        if preferred_work_mode == "any" or preferred_work_mode == job_remote_type:
            score += 25.0
            reasons.append(f"Work mode preference ({preferred_work_mode}) matches job ({job_remote_type})")
        elif job_remote_type == "remote":
            score += 20.0
            reasons.append("Job is fully remote, offering geographic flexibility")
            
        job_loc_lower = (job_location or "").lower()
        loc_matched = False
        if preferred_locations:
            for loc in preferred_locations:
                if loc.lower() in job_loc_lower:
                    score += 25.0
                    reasons.append(f"Location ({job_location}) matches preference ({loc})")
                    loc_matched = True
                    break
            if not loc_matched:
                reasons.append("Location differs from your preferred cities")
        else:
            score += 10.0
            reasons.append("Open to any location")
            
        return min(100.0, score), ". ".join(reasons)

    def _compute_recency(self, posted_at: Optional[datetime]) -> Tuple[float, str]:
        if not posted_at:
            return 45.0, "Posting date unknown"
            
        days_old = (datetime.now() - posted_at).days
        if days_old <= 3:
            return 100.0, f"Posted {days_old} days ago — freshly indexed"
        elif days_old <= 7:
            return 90.0, "Posted within the last week"
        elif days_old <= 14:
            return 75.0, "Posted within the last two weeks"
        elif days_old <= 30:
            return 50.0, "Posted within the last month"
        return 20.0, "Posted over 30 days ago"

    def compute_match(self, match_req: Dict[str, Any], execute_rerank: bool = True) -> Dict[str, Any]:
        """
        Executes full Two-Stage Matching:
        1. 8-Factor Baseline + ESCO Taxonomy Alignment -> enhanced_retrieval_score
        2. Selective LLM Reranking + Evidence Grounding -> final_score
        """
        # User & Resume Skills
        user_skills_raw = (match_req.get("user_skills") or []) + (match_req.get("resume_skills") or [])
        user_skills_canon = set(self.taxonomy.normalize(s) for s in user_skills_raw if s)

        # Job Skills
        job_req_raw = match_req.get("job_required_skills") or []
        job_pref_raw = match_req.get("job_preferred_skills") or []
        job_all_raw = job_req_raw + job_pref_raw
        job_all_canon = set(self.taxonomy.normalize(s) for s in job_all_raw if s)
        job_req_canon = set(self.taxonomy.normalize(s) for s in job_req_raw if s)
        job_pref_canon = set(self.taxonomy.normalize(s) for s in job_pref_raw if s)

        # 1. Exact Skill Match
        matched_skills = user_skills_canon & job_all_canon
        missing_req = job_req_canon - user_skills_canon
        missing_pref = job_pref_canon - user_skills_canon
        
        if job_all_canon:
            exact_skill_score = (len(matched_skills) / len(job_all_canon)) * 100.0
        else:
            exact_skill_score = 65.0

        # 2. Semantic Similarity (pgvector embeddings)
        r_emb = match_req.get("resume_embedding")
        j_emb = match_req.get("job_embedding")
        if r_emb and j_emb:
            sim = self.cosine_similarity(r_emb, j_emb)
            semantic_score = max(0.0, min(100.0, sim * 100.0))
        else:
            semantic_score = 50.0

        # 3. Fresher Fit
        fresher_score, fresher_reason = self._compute_fresher_fit(
            match_req.get("job_title", ""),
            match_req.get("job_description", ""),
            match_req.get("job_experience_level", "unknown")
        )

        # 4. Role Relevance
        role_relevance_score = 50.0
        job_title_lower = (match_req.get("job_title") or "").lower()
        for role in match_req.get("target_roles") or []:
            if role.lower() in job_title_lower:
                role_relevance_score = 95.0
                break

        # 5. Logistics Fit
        logistics_score, logistics_reason = self._compute_logistics(
            match_req.get("preferred_locations") or [],
            match_req.get("preferred_work_mode", "any"),
            match_req.get("job_location", ""),
            match_req.get("job_remote_type", "unknown")
        )

        # 6. Recency
        recency_score, recency_note = self._compute_recency(match_req.get("job_posted_at"))

        # 7. Source Confidence
        source_conf_score = (match_req.get("job_confidence_score") or 0.50) * 100.0
        source_lbl = "Verified ATS Feed" if match_req.get("job_source") in ["greenhouse", "lever"] else "Aggregated Feed"
        conf_lvl = "High Confidence" if source_conf_score >= 80 else "Medium Confidence"

        # 8. Resume Completeness
        completeness_score = match_req.get("resume_completeness_score") or 85.0

        # Compute Baseline 8-Factor Score
        factor_scores = {
            "exact_skill": round(exact_skill_score, 1),
            "semantic": round(semantic_score, 1),
            "fresher_fit": round(fresher_score, 1),
            "role_relevance": round(role_relevance_score, 1),
            "logistics": round(logistics_score, 1),
            "recency": round(recency_score, 1),
            "source_confidence": round(source_conf_score, 1),
            "completeness": round(completeness_score, 1)
        }
        base_hybrid_score = round(sum(factor_scores[k] * self.BASE_WEIGHTS[k] for k in self.BASE_WEIGHTS), 1)

        # Stage A Research Addition: Taxonomy-Enhanced Score
        taxonomy_score, taxonomy_matches = self.taxonomy.compute_taxonomy_overlap(
            list(user_skills_canon),
            list(job_req_canon),
            list(job_pref_canon)
        )
        
        # Enhanced retrieval score = 0.90 * base_hybrid + 0.10 * taxonomy_score
        enhanced_retrieval_score = round(
            (0.90 * base_hybrid_score) + (0.10 * taxonomy_score), 1
        )

        # Stage B Research Addition: Selective LLM Reranking & Evidence Validation
        rerank_score = enhanced_retrieval_score
        rerank_details = {
            "rerank_score": enhanced_retrieval_score,
            "decision": "strong_match" if enhanced_retrieval_score >= 80 else "moderate_match",
            "strengths": [],
            "gaps": [],
            "why_ranked_here": "Based on Stage A retrieval scoring.",
            "fallback_used": True,
            "model": "retrieval_baseline"
        }

        if execute_rerank:
            candidate_payload = {
                "job_title": match_req.get("job_title", ""),
                "description": match_req.get("job_description", ""),
                "required_skills": sorted(list(job_req_canon)),
                "matched_skills": sorted(list(matched_skills)),
                "missing_required": sorted(list(missing_req)),
                "enhanced_score": enhanced_retrieval_score
            }
            resume_text = match_req.get("resume_text", "")
            rerank_details = self.reranker.rerank_candidate(
                candidate_data=candidate_payload,
                resume_summary=match_req.get("resume_summary", ""),
                resume_skills=sorted(list(user_skills_canon)),
                resume_text=resume_text
            )
            rerank_score = rerank_details.get("rerank_score", enhanced_retrieval_score)

        # Final score calculation:
        # final_score = 0.80 * enhanced_retrieval_score + 0.20 * rerank_score
        if not rerank_details.get("fallback_used", False):
            final_score = round(
                (0.80 * enhanced_retrieval_score) + (0.20 * rerank_score), 1
            )
        else:
            final_score = enhanced_retrieval_score

        # Structured Explanation JSON matching Section 6.8
        explanation = {
            "base_score": base_hybrid_score,
            "taxonomy_score": taxonomy_score,
            "rerank_score": rerank_score,
            "final_score": final_score,
            "matched_skills": sorted(list(matched_skills)),
            "taxonomy_matches": taxonomy_matches,
            "missing_required": sorted(list(missing_req)),
            "missing_preferred": sorted(list(missing_pref)),
            "strengths": rerank_details.get("strengths", []),
            "gaps": rerank_details.get("gaps", []),
            "why_ranked_here": rerank_details.get("why_ranked_here", ""),
            "fresher_fit_reason": fresher_reason,
            "logistics_reason": logistics_reason,
            "source_label": source_lbl,
            "confidence_level": conf_lvl,
            "recency_note": recency_note,
            "reranker_model": rerank_details.get("model", "unknown"),
            "fallback_used": rerank_details.get("fallback_used", True)
        }

        return {
            "match_score": base_hybrid_score,
            "taxonomy_score": taxonomy_score,
            "enhanced_retrieval_score": enhanced_retrieval_score,
            "rerank_score": rerank_score,
            "final_score": final_score,
            "factor_scores": factor_scores,
            "explanation": explanation
        }

    compute = compute_match

# Aliases for backward compatibility
HybridMatcher = ResearchEnhancedMatcher
HybridMatcherService = ResearchEnhancedMatcher
