import os
import re
import json
import logging
from typing import List, Dict, Any, Tuple, Optional, Set

logger = logging.getLogger("TaxonomyService")

class TaxonomyService:
    def __init__(self, taxonomy_path: Optional[str] = None):
        self.taxonomy_path = taxonomy_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "skill_taxonomy.json"
        )
        self.terms: Dict[str, Dict[str, Any]] = {}
        self.alias_to_canonical: Dict[str, str] = {}
        self.load_taxonomy()

    def load_taxonomy(self):
        """Load ESCO baseline taxonomy and local synonyms."""
        if os.path.exists(self.taxonomy_path):
            try:
                with open(self.taxonomy_path, "r", encoding="utf-8") as f:
                    self.terms = json.load(f)
                
                for canonical, data in self.terms.items():
                    norm_can = canonical.lower().strip()
                    self.alias_to_canonical[norm_can] = norm_can
                    for alias in data.get("aliases", []):
                        norm_alias = alias.lower().strip()
                        self.alias_to_canonical[norm_alias] = norm_can
                        
                logger.info(f"Loaded {len(self.terms)} taxonomy terms with {len(self.alias_to_canonical)} aliases.")
            except Exception as e:
                logger.error(f"Failed to load taxonomy from {self.taxonomy_path}: {e}")

    def normalize(self, term: str) -> str:
        """Resolve a term or alias to its canonical taxonomy form."""
        clean = term.lower().strip()
        return self.alias_to_canonical.get(clean, clean)

    def extract_candidate_spans(self, text: str) -> List[Dict[str, Any]]:
        """Extract candidate skills, occupations, and qualifications from free text."""
        text_lower = text.lower()
        extracted: List[Dict[str, Any]] = []
        seen_canonicals: Set[str] = set()

        for canonical, data in self.terms.items():
            patterns = [canonical] + data.get("aliases", [])
            for pattern in patterns:
                escaped = re.escape(pattern)
                if "++" in pattern or "#" in pattern:
                    regex = rf"(?:^|\s|\b){escaped}(?:$|\s|\b|[.,;])"
                else:
                    regex = rf"\b{escaped}\b"

                match = re.search(regex, text_lower)
                if match and canonical not in seen_canonicals:
                    seen_canonicals.add(canonical)
                    # Extract snippet context as evidence
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    evidence = text[start:end].strip()

                    extracted.append({
                        "canonical": canonical,
                        "preferred_label": data.get("preferred_label", canonical.title()),
                        "term_type": data.get("term_type", "skill"),
                        "category": data.get("category", "General"),
                        "external_id": data.get("external_id", f"esco-{canonical}"),
                        "confidence": 0.95 if match.group(0).strip() == canonical else 0.85,
                        "evidence_text": evidence
                    })
                    break

        return extracted

    def link_terms(self, term_names: List[str]) -> List[Dict[str, Any]]:
        """Map a list of free-text terms to canonical taxonomy nodes with confidence."""
        linked = []
        for term in term_names:
            norm = self.normalize(term)
            if norm in self.terms:
                data = self.terms[norm]
                linked.append({
                    "original_term": term,
                    "canonical": norm,
                    "preferred_label": data.get("preferred_label", norm.title()),
                    "term_type": data.get("term_type", "skill"),
                    "category": data.get("category", "General"),
                    "external_id": data.get("external_id"),
                    "confidence_score": 1.0 if term.lower().strip() == norm else 0.90,
                    "source_method": "dictionary_alias_lookup"
                })
            else:
                linked.append({
                    "original_term": term,
                    "canonical": term.lower().strip(),
                    "preferred_label": term.title(),
                    "term_type": "skill",
                    "category": "Unclassified",
                    "external_id": None,
                    "confidence_score": 0.50,
                    "source_method": "unmapped_literal"
                })
        return linked

    def compute_taxonomy_overlap(
        self,
        resume_terms: List[str],
        job_req_terms: List[str],
        job_pref_terms: Optional[List[str]] = None
    ) -> Tuple[float, List[str]]:
        """
        Calculate taxonomy alignment score (0 - 100) based on canonical term overlap.
        Enhanced overlap formula weighting required vs preferred skills.
        """
        res_canonicals = set(self.normalize(t) for t in resume_terms if t)
        req_canonicals = set(self.normalize(t) for t in (job_req_terms or []) if t)
        pref_canonicals = set(self.normalize(t) for t in (job_pref_terms or []) if t)

        if not req_canonicals and not pref_canonicals:
            return 75.0, []

        matched_req = res_canonicals & req_canonicals
        matched_pref = res_canonicals & pref_canonicals
        matched_all = sorted(list(matched_req | matched_pref))

        req_weight = 0.75
        pref_weight = 0.25

        req_score = (len(matched_req) / len(req_canonicals)) if req_canonicals else 1.0
        pref_score = (len(matched_pref) / len(pref_canonicals)) if pref_canonicals else 1.0

        if req_canonicals and pref_canonicals:
            score = (req_score * req_weight + pref_score * pref_weight) * 100.0
        elif req_canonicals:
            score = req_score * 100.0
        else:
            score = pref_score * 100.0

        return round(min(100.0, max(0.0, score)), 1), matched_all
