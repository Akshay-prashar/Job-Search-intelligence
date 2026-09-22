import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.reranker_service import EvidenceValidator, SelectiveLLMReranker

class TestRerankerService(unittest.TestCase):
    def setUp(self):
        self.reranker = SelectiveLLMReranker()

    def test_pii_redaction(self):
        """Verify that emails and phone numbers are redacted."""
        raw_text = "Contact Jane Doe at jane.doe@example.com or +1 555-123-4567 for inquiries."
        redacted = self.reranker.redact_pii(raw_text)
        self.assertNotIn("jane.doe@example.com", redacted)
        self.assertNotIn("555-123-4567", redacted)
        self.assertIn("[REDACTED_EMAIL]", redacted)
        self.assertIn("[REDACTED_PHONE]", redacted)

    def test_evidence_validator_valid_claim(self):
        """Verify evidence is accepted when present in source text."""
        source = "Developed real-time chat application using React and WebSockets with Redis caching."
        valid_evidence = "React and WebSockets with Redis caching"
        self.assertTrue(EvidenceValidator.validate_claim_evidence(valid_evidence, source))

    def test_evidence_validator_hallucinated_claim(self):
        """Verify evidence is rejected when absent from source text."""
        source = "Developed real-time chat application using React and WebSockets."
        hallucinated = "Led a team of 15 engineers in Kubernetes microservice migration"
        self.assertFalse(EvidenceValidator.validate_claim_evidence(hallucinated, source))

    def test_evidence_validator_filter_evidence_claims(self):
        """Verify filter_evidence_claims separates verified from unverified evidence."""
        resume = "Hands-on experience with Python, FastAPI, and Docker in university projects."
        job = "Looking for a Junior Backend Developer familiar with Python and Docker."

        strengths = [
            {"claim": "Knows Python and FastAPI", "evidence": "experience with Python, FastAPI"},
            {"claim": "Kubernetes specialist", "evidence": "5 years running EKS clusters in production"},
        ]
        gaps = [
            {"claim": "No Kubernetes experience mentioned", "evidence": None}
        ]

        val_strengths, val_gaps = EvidenceValidator.filter_evidence_claims(
            strengths=strengths,
            gaps=gaps,
            resume_text=resume,
            job_text=job
        )

        self.assertEqual(len(val_strengths), 2)
        # First strength should be verified
        self.assertTrue(val_strengths[0]["verified"])
        self.assertIsNotNone(val_strengths[0]["evidence"])

        # Second strength should NOT be verified (unsupported evidence)
        self.assertFalse(val_strengths[1]["verified"])
        self.assertIsNone(val_strengths[1]["evidence"])

    def test_deterministic_rerank_fallback(self):
        """Verify deterministic fallback functions when no external API key is provided."""
        candidate = {
            "job_title": "Junior Full Stack Engineer",
            "description": "Building web apps with React and Node.js. Great opportunity for freshers.",
            "required_skills": ["react", "node.js", "postgresql"],
            "matched_skills": ["react", "node.js"],
            "missing_required": ["postgresql"],
            "enhanced_score": 82.0
        }
        resume_text = "Proficient in React, Node.js, and JavaScript. Built full-stack web applications."

        result = self.reranker.rerank_candidate(
            candidate_data=candidate,
            resume_summary="Full Stack Developer fresher",
            resume_skills=["react", "node.js", "javascript"],
            resume_text=resume_text
        )

        self.assertIn("rerank_score", result)
        self.assertGreater(result["rerank_score"], 0.0)
        self.assertLessEqual(result["rerank_score"], 100.0)
        self.assertIn("why_ranked_here", result)
        self.assertTrue(len(result["strengths"]) > 0)
        self.assertTrue(result["fallback_used"])

if __name__ == "__main__":
    unittest.main()
