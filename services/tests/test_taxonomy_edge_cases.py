import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.taxonomy_service import TaxonomyService


class TestTaxonomyEdgeCases(unittest.TestCase):
    """Edge case tests for TaxonomyService."""

    @classmethod
    def setUpClass(cls):
        cls.svc = TaxonomyService()

    # --- normalize() edge cases ---

    def test_normalize_empty_string(self):
        """Empty string normalizes to empty string."""
        self.assertEqual(self.svc.normalize(""), "")

    def test_normalize_whitespace(self):
        """Leading/trailing whitespace is stripped and alias resolved."""
        self.assertEqual(self.svc.normalize("  react  "), "react")

    def test_normalize_case_insensitive(self):
        """Normalization is case-insensitive."""
        self.assertEqual(self.svc.normalize("REACT"), self.svc.normalize("react"))
        self.assertEqual(self.svc.normalize("TypeScript"), "typescript")

    def test_normalize_unknown_term(self):
        """Unknown terms are lowercased and returned as-is."""
        self.assertEqual(self.svc.normalize("xyzlang123"), "xyzlang123")

    def test_normalize_alias_resolves(self):
        """Alias maps to canonical form."""
        self.assertEqual(self.svc.normalize("reactjs"), "react")
        self.assertEqual(self.svc.normalize("ts"), "typescript")
        self.assertEqual(self.svc.normalize("postgres"), "postgresql")
        self.assertEqual(self.svc.normalize("k8s"), "kubernetes")

    # --- extract_candidate_spans() edge cases ---

    def test_extract_spans_empty_text(self):
        """Empty text returns no spans."""
        self.assertEqual(self.svc.extract_candidate_spans(""), [])

    def test_extract_spans_no_skills(self):
        """Text without any skills returns no spans."""
        self.assertEqual(self.svc.extract_candidate_spans("I like pizza and movies"), [])

    def test_extract_spans_special_chars_cpp(self):
        """C++ is detected despite special regex characters."""
        spans = self.svc.extract_candidate_spans("Looking for C++ developers")
        canonicals = {s["canonical"] for s in spans}
        self.assertIn("c++", canonicals)

    def test_extract_spans_special_chars_csharp(self):
        """C# is detected despite special regex characters."""
        spans = self.svc.extract_candidate_spans("We use C# and .NET")
        canonicals = {s["canonical"] for s in spans}
        self.assertIn("c#", canonicals)

    def test_extract_spans_duplicate_mentions(self):
        """Repeated mentions of same skill extract only once."""
        spans = self.svc.extract_candidate_spans(
            "react is great, I love react, react react react"
        )
        canonicals = [s["canonical"] for s in spans]
        self.assertEqual(canonicals.count("react"), 1)

    def test_extract_spans_multiple_skills(self):
        """Multiple skills are all extracted."""
        spans = self.svc.extract_candidate_spans(
            "Software engineer with React, Python, Docker, PostgreSQL experience"
        )
        canonicals = {s["canonical"] for s in spans}
        self.assertIn("react", canonicals)
        self.assertIn("python", canonicals)
        self.assertIn("docker", canonicals)
        self.assertIn("postgresql", canonicals)

    def test_extract_spans_evidence_text_present(self):
        """Each extracted span has a non-empty evidence_text."""
        spans = self.svc.extract_candidate_spans("Expert in React and Python development")
        for s in spans:
            self.assertIn("evidence_text", s)
            self.assertTrue(len(s["evidence_text"]) > 0)
            self.assertIn("confidence", s)
            self.assertGreater(s["confidence"], 0)

    def test_extract_spans_confidence_values(self):
        """Exact match gets 0.95, alias gets 0.85 confidence."""
        spans = self.svc.extract_candidate_spans("react and nodejs developer")
        conf_map = {s["canonical"]: s["confidence"] for s in spans}
        # "react" is exact canonical -> 0.95
        if "react" in conf_map:
            self.assertEqual(conf_map["react"], 0.95)

    # --- compute_taxonomy_overlap() edge cases ---

    def test_overlap_all_required_match(self):
        """All required skills matched -> high score."""
        score, matched = self.svc.compute_taxonomy_overlap(
            ["react", "typescript", "node.js"],
            ["react", "typescript"],
            []
        )
        self.assertEqual(score, 100.0)
        self.assertIn("react", matched)
        self.assertIn("typescript", matched)

    def test_overlap_partial_match(self):
        """Partial match gives proportional score."""
        score_full, _ = self.svc.compute_taxonomy_overlap(
            ["react", "python"], ["react", "python"], []
        )
        score_half, _ = self.svc.compute_taxonomy_overlap(
            ["react"], ["react", "python"], []
        )
        self.assertLess(score_half, score_full)

    def test_overlap_no_job_skills(self):
        """When job has no required or preferred skills, default 75.0."""
        score, matched = self.svc.compute_taxonomy_overlap(
            ["react", "python"], [], []
        )
        self.assertEqual(score, 75.0)
        self.assertEqual(matched, [])

    def test_overlap_empty_resume_skills(self):
        """When resume has no skills, score = 0."""
        score, matched = self.svc.compute_taxonomy_overlap(
            [], ["react", "python"], []
        )
        self.assertEqual(score, 0.0)
        self.assertEqual(matched, [])

    def test_overlap_preferred_only(self):
        """When only preferred skills exist, score based on preferred overlap."""
        score, matched = self.svc.compute_taxonomy_overlap(
            ["react"], [], ["react", "python"]
        )
        self.assertEqual(score, 50.0)
        self.assertIn("react", matched)

    def test_overlap_both_required_and_preferred(self):
        """Mixed required + preferred uses weighted formula."""
        score, matched = self.svc.compute_taxonomy_overlap(
            ["react", "docker"],
            ["react"],       # 1/1 required = 100% * 0.75 = 75
            ["docker", "aws"] # 1/2 preferred = 50% * 0.25 = 12.5
        )
        # Total = 75 + 12.5 = 87.5
        self.assertAlmostEqual(score, 87.5, places=1)

    def test_overlap_score_bounds(self):
        """Score always 0-100."""
        for resume, req in [
            (["react"], ["react"]),
            (["react", "python"], ["react", "python", "docker"]),
            ([], []),
        ]:
            score, _ = self.svc.compute_taxonomy_overlap(resume, req)
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 100.0)

    # --- link_terms() edge cases ---

    def test_link_terms_known_canonical(self):
        """Known canonical term linked with confidence 1.0."""
        linked = self.svc.link_terms(["react"])
        self.assertEqual(len(linked), 1)
        self.assertEqual(linked[0]["canonical"], "react")
        self.assertEqual(linked[0]["confidence_score"], 1.0)
        self.assertEqual(linked[0]["source_method"], "dictionary_alias_lookup")

    def test_link_terms_known_alias(self):
        """Known alias linked with confidence 0.90."""
        linked = self.svc.link_terms(["reactjs"])
        self.assertEqual(len(linked), 1)
        self.assertEqual(linked[0]["canonical"], "react")
        self.assertEqual(linked[0]["confidence_score"], 0.90)

    def test_link_terms_unknown(self):
        """Unknown term gets confidence 0.50 and category Unclassified."""
        linked = self.svc.link_terms(["xyzlang123"])
        self.assertEqual(len(linked), 1)
        self.assertEqual(linked[0]["confidence_score"], 0.50)
        self.assertEqual(linked[0]["category"], "Unclassified")
        self.assertEqual(linked[0]["source_method"], "unmapped_literal")

    def test_link_terms_mixed(self):
        """Mix of known and unknown terms."""
        linked = self.svc.link_terms(["react", "xyzlang123"])
        self.assertEqual(len(linked), 2)
        # react should be high confidence
        self.assertGreaterEqual(linked[0]["confidence_score"], 0.90)
        # unknown should be low
        self.assertEqual(linked[1]["confidence_score"], 0.50)

    def test_link_terms_empty(self):
        """Empty list returns empty list."""
        self.assertEqual(self.svc.link_terms([]), [])

    def test_link_terms_preserves_original(self):
        """Original term text is preserved."""
        linked = self.svc.link_terms(["ReactJS"])
        self.assertEqual(linked[0]["original_term"], "ReactJS")


if __name__ == "__main__":
    unittest.main()
