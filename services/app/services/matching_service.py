import math
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.services.skill_taxonomy import normalize_skill

class HybridMatcher:
    # Match weights matching the plan configuration
    WEIGHTS = {
        "exact_skill":       0.25,
        "semantic":          0.20,
        "fresher_fit":       0.15,
        "role_relevance":    0.10,
        "logistics":         0.10,
        "recency":           0.10,
        "source_confidence": 0.05,
        "completeness":      0.05,
    }

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
        reason = "No explicit experience signal found in job posting."
        
        title_lower = title.lower()
        desc_lower = description.lower()
        
        fresher_keywords = ["intern", "new grad", "entry level", "junior", "fresher", "associate", "trainee", "graduate", "0-1 year", "0-2 year"]
        for kw in fresher_keywords:
            if kw in title_lower or kw in desc_lower:
                score = 90.0
                reason = f"Job metadata mentions '{kw}' which indicates a high suitability for freshers."
                break
                
        senior_keywords = ["senior", "lead", "principal", "staff", "architect", "manager", "director", "5+ years", "7+ years"]
        for kw in senior_keywords:
            if kw in title_lower or kw in desc_lower:
                score = 15.0
                reason = f"Job mentions '{kw}' which suggests it requires substantial full-time experience."
                break
                
        if experience_level == "intern":
            score = 98.0
            reason = "Internship role — highly suitable for freshers."
        elif experience_level == "entry":
            score = 85.0
            reason = "Entry-level position — standard fit for early career developers."
            
        return score, reason

    def _compute_logistics(self, preferred_locations: List[str], preferred_work_mode: str, job_location: str, job_remote_type: str) -> Tuple[float, str]:
        score = 50.0
        reasons = []
        
        # Work mode matching
        if preferred_work_mode == "any" or preferred_work_mode == job_remote_type:
            score += 25.0
            reasons.append(f"Work mode preference ({preferred_work_mode}) matches the job remote type ({job_remote_type})")
        elif job_remote_type == "remote":
            score += 20.0
            reasons.append("Job is Remote which offers high geographic flexibility")
            
        # Location matching
        job_loc_lower = job_location.lower()
        loc_matched = False
        if preferred_locations:
            for loc in preferred_locations:
                if loc.lower() in job_loc_lower:
                    score += 25.0
                    reasons.append(f"Job location ({job_location}) matches one of your preferred locations ({loc})")
                    loc_matched = True
                    break
            if not loc_matched:
                reasons.append("Job location does not match your list of preferred cities")
        else:
            score += 10.0
            reasons.append("No location constraints specified in user profile")
            
        return min(100.0, score), ". ".join(reasons)

    def _compute_recency(self, posted_at: Optional[datetime]) -> Tuple[float, str]:
        if not posted_at:
            return 40.0, "Unknown posting date"
            
        days_old = (datetime.now() - posted_at).days
        if days_old <= 3:
            return 100.0, f"Posted {days_old} days ago — very fresh listing"
        elif days_old <= 7:
            return 90.0, "Posted within the last week"
        elif days_old <= 14:
            return 75.0, "Posted within the last two weeks"
        elif days_old <= 30:
            return 50.0, "Posted within the last month"
        return 20.0, "Posted more than a month ago — may be filled or inactive"

    def compute_match(self, match_req: Dict[str, Any]) -> Dict[str, Any]:
        user_skills = set(normalize_skill(s) for s in (match_req.get("user_skills") or []) + (match_req.get("resume_skills") or []))
        
        # Extract job skills
        job_req_skills = set(normalize_skill(s) for s in match_req.get("job_required_skills") or [])
        job_pref_skills = set(normalize_skill(s) for s in match_req.get("job_preferred_skills") or [])
        job_all_skills = job_req_skills | job_pref_skills
        
        # 1. Exact Skill Match
        matched_skills = user_skills & job_all_skills
        missing_req = job_req_skills - user_skills
        missing_pref = job_pref_skills - user_skills
        
        if job_all_skills:
            exact_skill_score = (len(matched_skills) / len(job_all_skills)) * 100.0
        else:
            exact_skill_score = 50.0  # neutral
            
        # 2. Semantic Similarity
        r_emb = match_req.get("resume_embedding")
        j_emb = match_req.get("job_embedding")
        if r_emb and j_emb:
            sim = self.cosine_similarity(r_emb, j_emb)
            semantic_score = max(0.0, min(100.0, sim * 100.0))
        else:
            semantic_score = 50.0  # default neutral
            
        # 3. Fresher Fit
        fresher_score, fresher_reason = self._compute_fresher_fit(
            match_req.get("job_title", ""),
            match_req.get("job_description", ""),
            match_req.get("job_experience_level", "unknown")
        )
        
        # 4. Role Relevance
        role_relevance_score = 50.0
        job_title_lower = match_req.get("job_title", "").lower()
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
        source_lbl = "Verified Corporate Feed" if match_req.get("job_source") in ["greenhouse", "lever"] else "Community Aggregated Feed"
        conf_lvl = "High Confidence" if source_conf_score >= 80 else "Medium Confidence"
        
        # 8. Completeness
        completeness_score = match_req.get("resume_completeness_score") or 80.0
        
        # Composite calculation
        scores = {
            "exact_skill": exact_skill_score,
            "semantic": semantic_score,
            "fresher_fit": fresher_score,
            "role_relevance": role_relevance_score,
            "logistics": logistics_score,
            "recency": recency_score,
            "source_confidence": source_conf_score,
            "completeness": completeness_score
        }
        
        composite_score = sum(scores[k] * self.WEIGHTS[k] for k in self.WEIGHTS)
        composite_score = round(composite_score, 1)
        
        return {
            "match_score": composite_score,
            "factor_scores": scores,
            "explanation": {
                "matched_skills": sorted(list(matched_skills)),
                "missing_required": sorted(list(missing_req)),
                "missing_preferred": sorted(list(missing_pref)),
                "fresher_fit_reason": fresher_reason,
                "logistics_reason": logistics_reason,
                "source_label": source_lbl,
                "confidence_level": conf_lvl,
                "recency_note": recency_note
            }
        }

    compute = compute_match

class HybridMatcherService:
    @staticmethod
    def compute(match_req: Dict[str, Any]) -> Dict[str, Any]:
        return HybridMatcher().compute_match(match_req)
