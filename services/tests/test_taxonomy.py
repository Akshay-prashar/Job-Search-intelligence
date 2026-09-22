import unittest
import os
import sys

# Ensure app package is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.taxonomy_service import TaxonomyService

class TestTaxonomyService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.taxonomy = TaxonomyService()

    def test_taxonomy_loading(self):
        """Verify that taxonomy terms are loaded."""
        self.assertGreater(len(self.taxonomy.terms), 0)
        self.assertGreater(len(self.taxonomy.alias_to_canonical), 0)

    def test_term_normalization(self):
        """Verify normalization maps aliases to canonical terms."""
        self.assertEqual(self.taxonomy.normalize("reactjs"), "react")
        self.assertEqual(self.taxonomy.normalize("typescript"), "typescript")
        self.assertEqual(self.taxonomy.normalize("ts"), "typescript")
        self.assertEqual(self.taxonomy.normalize("postgres"), "postgresql")

    def test_candidate_span_extraction(self):
        """Verify span extraction identifies skills and context from free text."""
        sample_text = (
            "Software engineer skilled in React and Node.js. "
            "Experience building cloud solutions with Docker, Kubernetes, and PostgreSQL databases."
        )
        spans = self.taxonomy.extract_candidate_spans(sample_text)
        extracted_canonicals = {s["canonical"] for s in spans}

        self.assertIn("react", extracted_canonicals)
        self.assertIn("docker", extracted_canonicals)
        self.assertIn("postgresql", extracted_canonicals)

        # Check evidence snippet
        for s in spans:
            self.assertTrue(s["confidence"] > 0)
            self.assertTrue(len(s["evidence_text"]) > 0)

    def test_taxonomy_overlap_score(self):
        """Verify weighted overlap calculation between candidate and job."""
        candidate_skills = ["react", "typescript", "node.js", "docker"]
        job_req = ["react", "typescript"]
        job_pref = ["graphql", "aws"]

        score, matched_all = self.taxonomy.compute_taxonomy_overlap(candidate_skills, job_req, job_pref)
        self.assertGreater(score, 0.0)
        self.assertLessEqual(score, 100.0)
        self.assertIn("react", matched_all)
        self.assertIn("typescript", matched_all)

    def test_taxonomy_empty_overlap(self):
        """Verify behavior when no skills overlap."""
        candidate_skills = ["cobol", "fortran"]
        job_req = ["react", "next.js"]

        score, matched_all = self.taxonomy.compute_taxonomy_overlap(candidate_skills, job_req)
        self.assertEqual(score, 0.0)
        self.assertEqual(len(matched_all), 0)

if __name__ == "__main__":
    unittest.main()
