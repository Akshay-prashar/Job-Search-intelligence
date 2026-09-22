import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.matching_service import ResearchEnhancedMatcher

class TestResearchEnhancedMatcher(unittest.TestCase):
    def setUp(self):
        self.matcher = ResearchEnhancedMatcher()

    def test_cosine_similarity(self):
        """Verify vector cosine similarity calculation."""
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        self.assertAlmostEqual(self.matcher.cosine_similarity(v1, v2), 1.0)

        v3 = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(self.matcher.cosine_similarity(v1, v3), 0.0)

    def test_stage_a_scoring_formula(self):
        """Verify enhanced_retrieval_score = 0.90 * base_hybrid + 0.10 * taxonomy_score."""
        match_req = {
            "user_skills": ["python", "fastapi", "react", "postgresql"],
            "resume_skills": ["docker", "git"],
            "job_title": "Junior Full Stack Engineer",
            "job_description": "We are seeking a junior full stack developer with Python and React knowledge.",
            "job_experience_level": "entry",
            "job_required_skills": ["python", "react"],
            "job_preferred_skills": ["docker", "postgresql"],
            "target_roles": ["Full Stack Engineer"],
            "preferred_locations": ["Remote"],
            "preferred_work_mode": "remote",
            "job_location": "Remote",
            "job_remote_type": "remote",
            "resume_text": "Experienced in Python, FastAPI, React, and building Dockerized apps."
        }

        # Run without Stage B reranking
        result = self.matcher.compute_match(match_req, execute_rerank=False)

        base_score = result["match_score"]
        tax_score = result["taxonomy_score"]
        enhanced_score = result["enhanced_retrieval_score"]
        final_score = result["final_score"]

        expected_enhanced = round((0.90 * base_score) + (0.10 * tax_score), 1)
        self.assertEqual(enhanced_score, expected_enhanced)
        # When rerank is skipped/fallback, final_score equals enhanced_retrieval_score
        self.assertEqual(final_score, enhanced_score)

    def test_stage_b_scoring_fallback(self):
        """Verify final_score falls back to enhanced_retrieval_score when rerank fallback is used."""
        match_req = {
            "user_skills": ["python", "react"],
            "job_title": "Fresher Software Engineer",
            "job_description": "Entry-level fresher software engineer position. Python required.",
            "job_experience_level": "entry",
            "job_required_skills": ["python"],
            "job_preferred_skills": ["react"],
            "target_roles": ["Software Engineer"],
            "resume_text": "Recent CS graduate proficient in Python and React web development."
        }

        # Run with Stage B reranking (offline mode uses deterministic fallback)
        result = self.matcher.compute_match(match_req, execute_rerank=True)

        enhanced = result["enhanced_retrieval_score"]
        final = result["final_score"]

        # When fallback is used, final score equals enhanced retrieval score
        self.assertEqual(final, enhanced)
        self.assertIn("explanation", result)
        self.assertIn("base_score", result["explanation"])
        self.assertIn("factor_scores", result)

    def test_stage_b_scoring_active_rerank(self):
        """Verify final_score = 0.80 * enhanced + 0.20 * rerank when rerank is active."""
        from unittest.mock import patch

        match_req = {
            "user_skills": ["python", "react"],
            "job_title": "Fresher Software Engineer",
            "job_description": "Entry-level fresher software engineer position. Python required.",
            "job_experience_level": "entry",
            "job_required_skills": ["python"],
            "job_preferred_skills": ["react"],
            "target_roles": ["Software Engineer"],
            "resume_text": "Recent CS graduate proficient in Python and React web development."
        }

        mock_rerank_result = {
            "rerank_score": 90.0,
            "decision": "strong_match",
            "strengths": [{"claim": "Python skills", "evidence": "proficient in Python", "verified": True}],
            "gaps": [],
            "why_ranked_here": "Excellent candidate for fresher role",
            "fallback_used": False,
            "model": "mock-llm-reranker"
        }

        with patch.object(self.matcher.reranker, "rerank_candidate", return_value=mock_rerank_result):
            result = self.matcher.compute_match(match_req, execute_rerank=True)

            enhanced = result["enhanced_retrieval_score"]
            rerank = result["rerank_score"]
            final = result["final_score"]

            expected_final = round((0.80 * enhanced) + (0.20 * rerank), 1)
            self.assertEqual(final, expected_final)
            self.assertFalse(result["explanation"]["fallback_used"])

if __name__ == "__main__":
    unittest.main()
