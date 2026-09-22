import unittest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.matching_service import ResearchEnhancedMatcher


class TestMatchingEdgeCases(unittest.TestCase):
    """Edge cases for ResearchEnhancedMatcher."""

    def setUp(self):
        self.matcher = ResearchEnhancedMatcher()

    # --- Cosine Similarity Edge Cases ---

    def test_cosine_similarity_empty_vectors(self):
        self.assertEqual(self.matcher.cosine_similarity([], []), 0.0)
        self.assertEqual(self.matcher.cosine_similarity([0.1, 0.2], []), 0.0)
        self.assertEqual(self.matcher.cosine_similarity([], [0.1, 0.2]), 0.0)

    def test_cosine_similarity_different_lengths(self):
        self.assertEqual(self.matcher.cosine_similarity([1.0, 2.0], [1.0, 2.0, 3.0]), 0.0)

    def test_cosine_similarity_zero_vector(self):
        self.assertEqual(self.matcher.cosine_similarity([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]), 0.0)

    def test_cosine_similarity_identical_vectors(self):
        self.assertAlmostEqual(self.matcher.cosine_similarity([1.0, 2.0, 3.0], [1.0, 2.0, 3.0]), 1.0, places=4)

    def test_cosine_similarity_opposite_vectors(self):
        self.assertAlmostEqual(self.matcher.cosine_similarity([1.0, 0.0], [-1.0, 0.0]), -1.0, places=4)

    # --- Fresher Fit Helper Tests ---

    def test_fresher_fit_intern_level(self):
        score, reason = self.matcher._compute_fresher_fit("Software Intern", "Summer internship", "intern")
        self.assertEqual(score, 98.0)
        self.assertIn("Internship", reason)

    def test_fresher_fit_entry_level(self):
        score, reason = self.matcher._compute_fresher_fit("Junior Developer", "Entry level role", "entry")
        self.assertEqual(score, 88.0)

    def test_fresher_fit_senior_keywords(self):
        score, reason = self.matcher._compute_fresher_fit("Senior Principal Architect", "Requires 10+ years", "senior")
        self.assertEqual(score, 15.0)
        self.assertIn("substantial prior industry experience", reason)

    def test_fresher_fit_default(self):
        score, reason = self.matcher._compute_fresher_fit("Software Developer", "Write code", "unknown")
        self.assertEqual(score, 50.0)

    # --- Logistics Fit Helper Tests ---

    def test_logistics_exact_remote_match(self):
        score, reason = self.matcher._compute_logistics([], "remote", "San Francisco, CA", "remote")
        # 50 base + 25 work_mode match + 10 open location = 85
        self.assertEqual(score, 85.0)
        self.assertIn("matches", reason)

    def test_logistics_location_preference_match(self):
        score, reason = self.matcher._compute_logistics(["Bengaluru", "Remote"], "any", "Bengaluru, India", "onsite")
        # 50 base + 25 work_mode ('any') + 25 location match = 100
        self.assertEqual(score, 100.0)
        self.assertIn("matches preference", reason.lower())

    def test_logistics_no_preferences_defaults(self):
        score, reason = self.matcher._compute_logistics([], "any", "Austin, TX", "onsite")
        # 50 base + 25 work_mode ('any') + 10 open location = 85
        self.assertEqual(score, 85.0)

    # --- Recency Helper Tests ---

    def test_recency_fresh_post(self):
        score, reason = self.matcher._compute_recency(datetime.now() - timedelta(days=1))
        self.assertEqual(score, 100.0)
        self.assertIn("freshly indexed", reason)

    def test_recency_one_week_old(self):
        score, reason = self.matcher._compute_recency(datetime.now() - timedelta(days=6))
        self.assertEqual(score, 90.0)

    def test_recency_two_weeks_old(self):
        score, reason = self.matcher._compute_recency(datetime.now() - timedelta(days=12))
        self.assertEqual(score, 75.0)

    def test_recency_old_post(self):
        score, reason = self.matcher._compute_recency(datetime.now() - timedelta(days=45))
        self.assertEqual(score, 20.0)

    def test_recency_none_post_date(self):
        score, reason = self.matcher._compute_recency(None)
        self.assertEqual(score, 45.0)
        self.assertIn("unknown", reason.lower())

    # --- compute_match Full Pipeline Edge Cases ---

    def test_compute_match_empty_skills(self):
        """When neither candidate nor job has skills, exact skill defaults to 65.0."""
        req = {
            "job_title": "Software Trainee",
            "job_experience_level": "entry"
        }
        res = self.matcher.compute_match(req, execute_rerank=False)
        self.assertIn("final_score", res)
        self.assertGreater(res["final_score"], 0.0)
        self.assertEqual(res["factor_scores"]["exact_skill"], 65.0)
        self.assertEqual(res["taxonomy_score"], 75.0)

    def test_compute_match_perfect_skill_overlap(self):
        req = {
            "user_skills": ["react", "typescript", "node.js"],
            "job_required_skills": ["react", "typescript"],
            "job_preferred_skills": ["node.js"],
            "job_title": "Junior Full Stack Engineer",
            "job_experience_level": "entry",
            "target_roles": ["fullstack"]
        }
        res = self.matcher.compute_match(req, execute_rerank=False)
        self.assertEqual(res["factor_scores"]["exact_skill"], 100.0)
        self.assertEqual(res["taxonomy_score"], 100.0)
        self.assertGreater(res["enhanced_retrieval_score"], 70.0)

    def test_compute_match_score_bounds(self):
        req = {
            "job_title": "Random Role",
            "user_skills": ["cobol", "fortran"],
            "job_required_skills": ["react", "vue"],
            "job_confidence_score": 0.5
        }
        res = self.matcher.compute_match(req, execute_rerank=False)
        self.assertTrue(0.0 <= res["final_score"] <= 100.0)
        self.assertTrue(0.0 <= res["enhanced_retrieval_score"] <= 100.0)

    def test_compute_match_stage_a_formula(self):
        """Verify enhanced_retrieval_score = round(0.90 * base_hybrid + 0.10 * taxonomy_score, 1)."""
        req = {
            "job_title": "Junior Backend Developer",
            "user_skills": ["python", "fastapi"],
            "job_required_skills": ["python", "fastapi"],
            "job_experience_level": "entry"
        }
        res = self.matcher.compute_match(req, execute_rerank=False)
        base = res["match_score"]
        tax = res["taxonomy_score"]
        expected_enhanced = round((0.90 * base) + (0.10 * tax), 1)
        self.assertEqual(res["enhanced_retrieval_score"], expected_enhanced)

    def test_compute_match_stage_b_active_rerank(self):
        req = {
            "job_title": "Frontend Engineer",
            "user_skills": ["react", "typescript"],
            "job_required_skills": ["react", "typescript", "next.js"],
            "resume_text": "Experienced React and TypeScript engineer building modern SPAs.",
            "job_experience_level": "entry"
        }
        res = self.matcher.compute_match(req, execute_rerank=True)
        self.assertIn("rerank_score", res)
        self.assertIn("strengths", res["explanation"])
        self.assertIn("gaps", res["explanation"])
        self.assertIn("why_ranked_here", res["explanation"])


if __name__ == "__main__":
    unittest.main()
