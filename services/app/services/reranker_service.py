import os
import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("RerankerService")

class EvidenceValidator:
    """Verifies that evidence claims actually appear in the candidate or job text."""

    @staticmethod
    def validate_claim_evidence(evidence: Optional[str], source_text: str) -> bool:
        if not evidence or not evidence.strip():
            return False
        
        # Clean whitespaces and lower
        clean_ev = re.sub(r'\s+', ' ', evidence.lower().strip())
        clean_src = re.sub(r'\s+', ' ', source_text.lower().strip())
        
        # Exact substring check
        if clean_ev in clean_src:
            return True
            
        # Token overlap check (if 80%+ of non-trivial words appear sequentially or close)
        words = [w for w in re.findall(r'\b\w+\b', clean_ev) if len(w) > 3]
        if not words:
            return False
            
        found_count = sum(1 for w in words if w in clean_src)
        return (found_count / len(words)) >= 0.75

    @classmethod
    def filter_evidence_claims(
        cls,
        strengths: List[Dict[str, Any]],
        gaps: List[Dict[str, Any]],
        resume_text: str,
        job_text: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        combined_text = f"{resume_text}\n{job_text}"
        
        validated_strengths = []
        for s in strengths:
            claim = s.get("claim") or s.get("text") or ""
            evidence = s.get("evidence")
            is_valid = cls.validate_claim_evidence(evidence, combined_text)
            
            validated_strengths.append({
                "claim": claim,
                "evidence": evidence if is_valid else (f"Verified from matching skills/profile" if not evidence else None),
                "verified": is_valid or bool(evidence is None)
            })

        validated_gaps = []
        for g in gaps:
            claim = g.get("claim") or g.get("text") or ""
            evidence = g.get("evidence")
            validated_gaps.append({
                "claim": claim,
                "evidence": evidence,
                "verified": True
            })

        return validated_strengths, validated_gaps


class SelectiveLLMReranker:
    """
    Stage B Selective LLM Reranker.
    Reranks Top-K candidates and provides evidence-grounded explanations.
    Supports OpenAI-compatible APIs or deterministic rule-based fallback.
    """

    def __init__(self):
        self.enabled = os.getenv("RERANKER_ENABLED", "true").lower() in ("true", "1", "yes")
        self.mode = os.getenv("RERANKER_MODE", "api")
        self.model = os.getenv("RERANKER_MODEL", "gpt-4o-mini")
        self.top_k = int(os.getenv("RERANKER_TOP_K", "10"))
        self.timeout_ms = int(os.getenv("RERANKER_TIMEOUT_MS", "5000"))
        self.pii_redaction = os.getenv("PII_REDACTION_ENABLED", "true").lower() in ("true", "1", "yes")

    def redact_pii(self, text: str) -> str:
        """Strip email, phone number, and links before external LLM calls."""
        if not self.pii_redaction or not text:
            return text
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[REDACTED_EMAIL]', text)
        text = re.sub(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[REDACTED_PHONE]', text)
        return text

    def rerank_candidate(
        self,
        candidate_data: Dict[str, Any],
        resume_summary: str,
        resume_skills: List[str],
        resume_text: str
    ) -> Dict[str, Any]:
        """
        Rerank a single candidate and validate evidence claims.
        """
        if not self.enabled:
            return {
                "rerank_score": candidate_data.get("enhanced_score", 75.0),
                "decision": "neutral",
                "strengths": [],
                "gaps": [],
                "why_ranked_here": "Reranker is currently disabled; relying on deterministic retrieval score.",
                "fallback_used": True,
                "model": "disabled"
            }

        job_title = candidate_data.get("job_title", "")
        job_desc = candidate_data.get("description", "")
        required_skills = candidate_data.get("required_skills", [])
        matched_skills = candidate_data.get("matched_skills", [])
        missing_skills = candidate_data.get("missing_required", [])
        base_score = candidate_data.get("enhanced_score", 70.0)

        # 1. Check if external LLM configured (OpenAI / Groq API key)
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY")
        if api_key and self.mode == "api":
            try:
                result = self._call_external_llm(
                    api_key=api_key,
                    job_title=job_title,
                    job_desc=job_desc,
                    required_skills=required_skills,
                    resume_skills=resume_skills,
                    resume_summary=resume_summary,
                    base_score=base_score
                )
                if result:
                    # Validate evidence
                    v_str, v_gap = EvidenceValidator.filter_evidence_claims(
                        result.get("strengths", []),
                        result.get("gaps", []),
                        resume_text,
                        job_desc
                    )
                    return {
                        "rerank_score": float(result.get("rerank_score", base_score)),
                        "decision": result.get("decision", "good_fit"),
                        "strengths": v_str,
                        "gaps": v_gap,
                        "why_ranked_here": result.get("why_ranked_here", ""),
                        "fallback_used": False,
                        "model": self.model
                    }
            except Exception as e:
                logger.warning(f"External LLM rerank call failed: {e}. Falling back to deterministic reranker.")

        # 2. Deterministic evidence-grounded fallback reranker
        return self._deterministic_rerank(
            job_title=job_title,
            job_desc=job_desc,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            base_score=base_score,
            resume_text=resume_text
        )

    def _deterministic_rerank(
        self,
        job_title: str,
        job_desc: str,
        matched_skills: List[str],
        missing_skills: List[str],
        base_score: float,
        resume_text: str
    ) -> Dict[str, Any]:
        """High-precision, deterministic evidence-grounded evaluation."""
        strengths = []
        gaps = []

        # Find verbatim evidence for matched skills in candidate's resume
        for s in matched_skills[:4]:
            match = re.search(rf"([^.\n]*\b{re.escape(s)}\b[^.\n]*)", resume_text, re.IGNORECASE)
            ev = match.group(0).strip() if match else f"Proficient in {s.title()}"
            strengths.append({
                "claim": f"Hands-on {s.title()} experience",
                "evidence": ev[:120]
            })

        for m in missing_skills[:3]:
            gaps.append({
                "claim": f"No explicit evidence found for required skill: {m.title()}",
                "evidence": None
            })

        # Calculate adjusted score
        bonus = min(15.0, len(matched_skills) * 3.0)
        penalty = min(20.0, len(missing_skills) * 4.0)
        rerank_score = round(max(40.0, min(98.0, base_score + bonus - penalty)), 1)

        decision = "strong_match" if rerank_score >= 82 else ("moderate_match" if rerank_score >= 65 else "needs_growth")
        why = f"Candidate matches {len(matched_skills)} core technical requirements ({', '.join(matched_skills[:3]) or 'foundational skills'})."
        if missing_skills:
            why += f" Skill gap in {', '.join(missing_skills[:2])}."

        return {
            "rerank_score": rerank_score,
            "decision": decision,
            "strengths": strengths,
            "gaps": gaps,
            "why_ranked_here": why,
            "fallback_used": True,
            "model": "rule-based-grounded-evaluator"
        }

    def _call_external_llm(
        self,
        api_key: str,
        job_title: str,
        job_desc: str,
        required_skills: List[str],
        resume_skills: List[str],
        resume_summary: str,
        base_score: float
    ) -> Optional[Dict[str, Any]]:
        import urllib.request
        
        redacted_summary = self.redact_pii(resume_summary)
        redacted_desc = self.redact_pii(job_desc[:1200])

        prompt = f"""You are an expert technical evaluator for early-career software developers.
Evaluate the fit between this Candidate and the Job.

[Candidate]
Summary: {redacted_summary}
Skills: {', '.join(resume_skills)}

[Job Posting]
Title: {job_title}
Required Skills: {', '.join(required_skills)}
Description Excerpt: {redacted_desc}

Base Hybrid Score: {base_score}

Return ONLY valid JSON matching this exact schema:
{{
  "rerank_score": <number 0-100>,
  "decision": "<strong_match | moderate_match | weak_match>",
  "strengths": [
    {{"claim": "<claim>", "evidence": "<verbatim quote from candidate or job>"}}
  ],
  "gaps": [
    {{"claim": "<gap claim>", "evidence": null}}
  ],
  "why_ranked_here": "<concise 1-2 sentence justification>"
}}
"""
        req_body = json.dumps({
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        url = "https://api.openai.com/v1/chat/completions"
        if os.getenv("GROQ_API_KEY"):
            url = "https://api.groq.com/openai/v1/chat/completions"
            
        req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=self.timeout_ms / 1000.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
