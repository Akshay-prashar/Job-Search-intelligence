import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.reranker_service import EvidenceValidator, SelectiveLLMReranker


class TestRerankerEdgeCases(unittest.TestCase):
    """Edge cases for SelectiveLLMReranker and EvidenceValidator."""

    def setUp(self):
        self.reranker = SelectiveLLMReranker()

    # --- PII Redaction Tests ---

    def test_pii_no_pii(self):
        text = "Experienced frontend engineer building React and TypeScript apps."
        self.assertEqual(self.reranker.redact_pii(text), text)

    def test_pii_multiple_emails(self):
        text = "Reach me at test.user@example.com or admin_team@domain.co.uk"
        redacted = self.reranker.redact_pii(text)
        self.assertNotIn("test.user@example.com", redacted)
        self.assertNotIn("admin_team@domain.co.uk", redacted)
        self.assertIn("[REDACTED_EMAIL]", redacted)

    def test_pii_phone_numbers(self):
        text = "Call +1-555-123-4567 or 555-987-6543 for references."
        redacted = self.reranker.redact_pii(text)
        self.assertNotIn("555-123-4567", redacted)
        self.assertNotIn("555-987-6543", redacted)
        self.assertIn("[REDACTED_PHONE]", redacted)

    def test_pii_empty_text(self):
        self.assertEqual(self.reranker.redact_pii(""), "")

    def test_pii_none_text(self):
        self.assertIsNone(self.reranker.redact_pii(None))

    def test_pii_disabled(self):
        self.reranker.pii_redaction = False
        text = "Email is contact@example.com"
        self.assertEqual(self.reranker.redact_pii(text), text)
        self.reranker.pii_redaction = True  # reset

    # --- EvidenceValidator Tests ---

    def test_evidence_validator_empty_evidence(self):
        self.assertFalse(EvidenceValidator.validate_claim_evidence("", "Source document text"))
        self.assertFalse(EvidenceValidator.validate_claim_evidence("   ", "Source document text"))

    def test_evidence_validator_none_evidence(self):
        self.assertFalse(EvidenceValidator.validate_claim_evidence(None, "Source document text"))

    def test_evidence_validator_exact_substring(self):
        source = "Architected a scalable microservices backend using FastAPI and Docker."
        self.assertTrue(EvidenceValidator.validate_claim_evidence("FastAPI and Docker", source))

    def test_evidence_validator_whitespace_normalization(self):
        source = "Architected a scalable   microservices  backend."
        self.assertTrue(EvidenceValidator.validate_claim_evidence("scalable microservices backend", source))

    def test_evidence_validator_token_overlap_sufficient(self):
        # 75%+ non-trivial words appear
        source = "Led the development of a real-time messaging platform using WebSockets and Redis caching."
        evidence = "real-time messaging platform with WebSockets"
        self.assertTrue(EvidenceValidator.validate_claim_evidence(evidence, source))

    def test_evidence_validator_token_overlap_insufficient(self):
        # completely unrelated text
        source = "Led the development of a real-time messaging platform using WebSockets and Redis."
        evidence = "Machine learning model optimization using PyTorch tensors on GPU clusters"
        self.assertFalse(EvidenceValidator.validate_claim_evidence(evidence, source))

    def test_filter_empty_arrays(self):
        str_res, gap_res = EvidenceValidator.filter_evidence_claims([], [], "resume text", "job text")
        self.assertEqual(str_res, [])
        self.assertEqual(gap_res, [])

    def test_filter_evidence_verification_flags(self):
        strengths = [
            {"claim": "Python mastery", "evidence": "Built high-throughput Python API"},
            {"claim": "Rust mastery", "evidence": "Fabricated Rust bare-metal kernel"}
        ]
        gaps = [
            {"claim": "Missing Kubernetes", "evidence": None}
        ]
        resume = "Built high-throughput Python API for analytics service."
        job = "Looking for Python and Kubernetes engineer."

        v_strengths, v_gaps = EvidenceValidator.filter_evidence_claims(
            strengths=strengths,
            gaps=gaps,
            resume_text=resume,
            job_text=job
        )

        # First strength evidence exists in resume -> verified=True
        self.assertTrue(v_strengths[0]["verified"])
        self.assertEqual(v_strengths[0]["evidence"], "Built high-throughput Python API")

        # Second strength evidence does NOT exist -> verified=False, evidence=None
        self.assertFalse(v_strengths[1]["verified"])
        self.assertIsNone(v_strengths[1]["evidence"])

        # Gaps are preserved with verified=True
        self.assertEqual(len(v_gaps), 1)
        self.assertTrue(v_gaps[0]["verified"])

    # --- SelectiveLLMReranker Tests ---

    def test_reranker_disabled_mode(self):
        self.reranker.enabled = False
        res = self.reranker.rerank_candidate(
            candidate_data={"enhanced_score": 82.5},
            resume_summary="Summary",
            resume_skills=["react"],
            resume_text="Resume text"
        )
        self.assertEqual(res["rerank_score"], 82.5)
        self.assertEqual(res["decision"], "neutral")
        self.assertTrue(res["fallback_used"])
        self.reranker.enabled = True  # reset

    def test_reranker_deterministic_fallback(self):
        # In test mode without external API keys, deterministic fallback triggers
        candidate_data = {
            "job_title": "Full Stack Engineer",
            "description": "Looking for React and Node.js developer with PostgreSQL skills",
            "required_skills": ["react", "node.js", "postgresql"],
            "matched_skills": ["react", "postgresql"],
            "missing_required": ["node.js"],
            "enhanced_score": 75.0
        }
        res = self.reranker.rerank_candidate(
            candidate_data=candidate_data,
            resume_summary="Full stack dev skilled in React and PostgreSQL",
            resume_skills=["react", "postgresql"],
            resume_text="Developed web portal using React frontend and PostgreSQL database."
        )

        self.assertIn("rerank_score", res)
        self.assertGreater(res["rerank_score"], 40.0)
        self.assertLessEqual(res["rerank_score"], 98.0)
        self.assertIn("decision", res)
        self.assertIn(res["decision"], ["strong_match", "moderate_match", "needs_growth"])
        self.assertTrue(res["fallback_used"])
        self.assertEqual(res["model"], "rule-based-grounded-evaluator")
        self.assertTrue(len(res["strengths"]) > 0)
        self.assertTrue(len(res["gaps"]) > 0)

    def test_reranker_all_matched_skills(self):
        candidate_data = {
            "job_title": "Junior React Developer",
            "description": "Building UI with React and Tailwind",
            "required_skills": ["react", "tailwind css"],
            "matched_skills": ["react", "tailwind css"],
            "missing_required": [],
            "enhanced_score": 85.0
        }
        res = self.reranker.rerank_candidate(
            candidate_data=candidate_data,
            resume_summary="React developer",
            resume_skills=["react", "tailwind css"],
            resume_text="Built UI with React and styled with Tailwind CSS components."
        )
        # Should have bonus applied
        self.assertGreaterEqual(res["rerank_score"], 85.0)
        self.assertEqual(len(res["gaps"]), 0)

    def test_reranker_empty_candidate_skills(self):
        candidate_data = {
            "job_title": "Senior Cloud Architect",
            "description": "AWS, Kubernetes, Terraform",
            "required_skills": ["aws", "kubernetes", "terraform"],
            "matched_skills": [],
            "missing_required": ["aws", "kubernetes", "terraform"],
            "enhanced_score": 45.0
        }
        res = self.reranker.rerank_candidate(
            candidate_data=candidate_data,
            resume_summary="",
            resume_skills=[],
            resume_text=""
        )
        self.assertLessEqual(res["rerank_score"], 50.0)
        self.assertEqual(len(res["strengths"]), 0)
        self.assertEqual(len(res["gaps"]), 3)


if __name__ == "__main__":
    unittest.main()
